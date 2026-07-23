import Phaser from 'phaser';
import {
  actionState,
  advanceActionActivation,
  createLifecycle,
  createMechanicHost,
  createPresentationHost,
  composeRecipes,
  createWorldRuntime,
  createInputIntent,
  executeContextualAction,
  lifecycleEvent,
  runCleanups,
  selectContextualAction,
} from '@phaser-game-engines/toolkit/core';
import { shouldCollideOneWay } from '../systems/movement.js';
import {
  createAreaTransitionController as createHeadlessAreaTransitionController,
  createTraversalController as createHeadlessTraversalController,
} from '../controllers/index.js';
import EntityManager from '../entities/EntityManager.js';
import { BASE_ENTITY_TYPES } from '../entities/registry.js';
import { validatePlatformerLevel } from '../systems/content.js';

// PlatformerScene adapts the generic controllers to Phaser Arcade Physics. It owns only
// locomotion, world loading, entity lifecycle, contextual actions, and presentation hooks.
// Combat, health, dialogue, checkpoints, and failure policy are opt-in recipes.
//
// It knows NOTHING about this game's rules. Where a decision is game-specific — how high a
// jump is, whether a checkpoint is "lit", what happens when you rest at one, whether
// completing an objective matters — it calls an overridable HOOK or reads a PROVIDER
// (methods below with generic defaults). A game subclasses this scene and overrides those
// to layer its ruleset on, so the engine has zero imports from the game or its content.
//
// The subclass supplies its world through getLevel() (see the LEVEL SCHEMA note there) and
// wires its state up in pgeInit().

// --- Engine tuning (generic platformer feel; a game doesn't retune these) ---
const ONE_WAY_GRACE = 8; // px slack for landing on a one-way ("thin") platform's top

// Generic movement/animation-state thresholds.
const RUN_ANIM_MIN_VX = 20; // px/s below which a grounded player reads as standing

// Default rectangle-player collision box (a game that skins the player overrides
// createPlayerObject and sizes its own body).
const DEFAULT_BODY_W = 26;
const DEFAULT_BODY_H = 40;

// The engine's neutral palette for the shapes it draws. Platform tints are chosen by a
// data-declared `kind` so the engine never keys off specific level ids; a game/level can
// override any of these by theming its own data.
const PAL = {
  player: 0x8fd3ff,
  floor: 0x2b3242,
  platform: 0x455168,
  step: 0x3f4a5f,
  ceiling: 0x4a5168,
  label: '#6b7488',
  thin: 0x6c86a8, // one-way "thin" platform — lighter than a solid so it reads as pass-through
};

/** @typedef {{ read(context?: { scene: PlatformerScene, time?: number, delta?: number }): import('@phaser-game-engines/toolkit/core').InputIntentSource, reset?(): unknown }} SceneControls */

export default class PlatformerScene extends Phaser.Scene {
  /** @param {{ controls?: SceneControls, [key: string]: any }} config */
  constructor(config = {}) {
    super(config);
    this.recipeComposition = composeRecipes(config.recipes ?? []);
    this.configuredMechanics = [
      ...this.recipeComposition.mechanics,
      ...(config.mechanics ?? []),
    ];
    this.entityTypes = config.entityTypes;
    this.controls = config.controls ?? null;
    if (this.controls && typeof this.controls.read !== 'function') {
      throw new TypeError('Platformer scene controls must expose read(context).');
    }
    this.worldRuntimeOptions = config.worldRuntime ?? {};
    this.simulationGates = new Set();
    this.lifecycle = createLifecycle();
    this.mechanicHost = createMechanicHost(this);
    this.presentation = createPresentationHost(this, config.presentation);
  }

  create() {
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      runCleanups([
        () => this.lifecycle.emit(lifecycleEvent.shutdown, { scene: this }),
        () => this.controls?.reset?.(),
        () => this.mechanicHost.clear(),
        () => this.entities?.destroyAll(this),
        () => this.presentation.clear(),
      ], 'Platformer scene shutdown failed.');
    });
    // The subclass initialises game-owned state before anything reads it.
    this.pgeInit();

    // LEVEL SCHEMA (returned by getLevel()): {
    //   world: {width,height}, spawn: {x,y},
    //   floorSegments: [{x,y,w,h}], platforms: [{x,y,w,h,kind?}], labels: [{x,y,text}],
    //   entitySpecs: [...], entityTypes?: {type->Class}, fog?: {...}
    // } — everything about THIS world lives in that data, nothing about it lives here.
    // The game returns the STARTING area's schema (which area that is may depend on the
    // save — the last-rested beacon can live in any area). enterArea(id) fetches others.
    this.level = this.getLevel();
    const types = {
      ...BASE_ENTITY_TYPES,
      ...this.recipeComposition.entityTypes,
      ...(this.level.entityTypes ?? {}),
      ...(this.entityTypes ?? {}),
    };
    this.worldRuntime = createWorldRuntime({
      ...this.worldRuntimeOptions,
      types,
      EntityStoreType: EntityManager,
      clock: this.worldRuntimeOptions.clock ?? (() => this.time.now),
    });
    this.validateLevelContent(this.level);
    for (const mechanic of this.configuredMechanics) this.mechanicHost.install(mechanic);
    this.currentAreaId = this.level.id ?? null;
    this.transitioning = false;

    this.physics.world.setBounds(0, 0, this.level.world.width, this.level.world.height);
    this.cameras.main.setBounds(0, 0, this.level.world.width, this.level.world.height);

    // Persistent physics groups + the entity manager. They OUTLIVE an area load: a
    // transition clears their children and refills them for the new area, so the
    // player↔world colliders wired once (below) stay valid across every load.
    this.solids = this.physics.add.staticGroup();
    this.oneWayPlatforms = this.physics.add.staticGroup();
    this.movers = this.physics.add.group({ allowGravity: false, immovable: true });
    // World display objects that live outside a group (floor labels, …), tracked so a load
    // can tear them down.
    this.worldDecor = [];
    this.entities = this.worldRuntime.entities;
    this.traversalController = this.createTraversalController();
    this.areaTransitionController = this.createAreaTransitionController();

    this.buildWorld();
    this.buildPlayer();
    // Every targetable/collectible/autonomous entity lives in one instantiated list; the
    // scene loops over it generically. Built after the player so entities can read it.
    this.entities.build(this, this.level.entitySpecs);
    this.pgeOnEntitiesBuilt();

    this.physics.add.collider(this.player, this.solids);
    // Ride-on moving platforms live in their own dynamic group so they can move; one
    // collider carries the player on them (the platforms handle horizontal carry).
    this.physics.add.collider(this.player, this.movers);
    // One-way ("thin") platforms: a process callback decides per-frame whether the player
    // lands (descending onto the top) or passes through (rising, or dropping through). The
    // collide callback records that we're resting on one, so down+jump knows to drop.
    this.physics.add.collider(
      this.player,
      this.oneWayPlatforms,
      this.onOneWayContact,
      this.oneWayProcess,
      this,
    );

    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);

    this.keys = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      jump: Phaser.Input.Keyboard.KeyCodes.SPACE,
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN, // drop through a one-way platform (with jump)
      s: Phaser.Input.Keyboard.KeyCodes.S,
      primary: Phaser.Input.Keyboard.KeyCodes.F,
      interact: Phaser.Input.Keyboard.KeyCodes.E,
    });
    this.controls?.reset?.();

    // Per-scene transient state (engine + game).
    this.resetTransient();

    this.pgeOnReady();
    this.lifecycle.emit(lifecycleEvent.ready, { scene: this });
  }

  // --- overridable HOOKS & PROVIDERS (generic defaults; a game overrides) -----
  // Lifecycle
  pgeInit() {} // subclass: load game-owned state
  getLevel() { throw new Error('PlatformerScene.getLevel() must be overridden'); }
  createTraversalController() { return createHeadlessTraversalController(); }
  createAreaTransitionController() { return createHeadlessAreaTransitionController(); }
  pgeOnReady() {} // subclass: launch HUD, install debug hooks
  pgeOnEntitiesBuilt() {} // subclass: cache typed entity handles for its HUD
  pgeOnResetTransient() {} // subclass: reset its own scene-local transient state
  // Movement parameters
  jumpVelocity() { return -420; }
  moveMaxSpeed() { return 160; }
  moveAccel() { return 900; }
  // Movement feature switches (generic defaults = classic single-jump platformer; a game
  // opts extras in by overriding these).
  airJumpCount() { return 0; } // extra mid-air jumps allowed (double jump: return 1)
  groundDragX() { return 1400; } // horizontal friction while standing on something
  airDragX() { return 0; } // in-air horizontal drag — 0 keeps momentum through jumps/drops
  dashConfig() { return null; } // null = no dash; else {enabled,speed,durationMs,cooldownMs,doubleTapMs,iFrames,airborne,iFrameMs,airDashes}
  coyoteMs() { return 0; } // grace window to still ground-jump just after leaving a ledge
  jumpBufferMs() { return 0; } // window a jump press is remembered so it fires on landing
  fastFallGravity() { return 0; } // extra downward gravity while holding down in the air (0 = off)
  wallSlideConfig() { return null; } // null = no wall slide/jump; else {slideSpeed,jumpPushX,lockMs}
  ledgeGrabConfig() { return null; } // null = no ledge grab; else {reach,band,cooldownMs}
  pgeUpdatePlayerVisual(/* time, onGround */) {}
  createPlayerObject(x, y) {
    this.playerPresentation = this.createPrefab('player', { x, y }, ({ scene }) => {
      return scene.add.rectangle(x, y, DEFAULT_BODY_W, DEFAULT_BODY_H, PAL.player);
    });
    const player = this.playerPresentation.body;
    if (!player.body) this.physics.add.existing(player);
    return player;
  }
  /** @param {string} name @param {Record<string, any>} [props] @param {import('@phaser-game-engines/toolkit/core').PresentationFactory} [fallback] */
  createPrefab(name, props = {}, fallback = undefined) { return this.presentation.createPrefab(name, props, fallback); }
  /** @param {string} name @param {Record<string, any>} [props] @param {import('@phaser-game-engines/toolkit/core').PresentationFactory} [fallback] */
  present(name, props = {}, fallback = undefined) { return this.presentation.present(name, props, fallback); }
  // Where the scene begins. A recipe may supply a game-owned respawn policy.
  spawnPoint() { return this.level.spawn; }
  // Escalation tier for spawners etc. (no danger model in the bare engine).
  currentDangerTier() { return 0; }
  validateLevelContent(level, path = 'level') {
    return validatePlatformerLevel(level, { path, types: this.worldRuntime.registry });
  }
  /** Pause simulation while any registered gate returns true. Input still updates. */
  addSimulationGate(gate) {
    if (typeof gate !== 'function') throw new TypeError('A simulation gate must be a function.');
    this.simulationGates.add(gate);
    return () => this.simulationGates.delete(gate);
  }
  /** Override to supply gamepad, touch, AI, network, or replay input.
   * @returns {import('@phaser-game-engines/toolkit/core').InputIntentSource}
   */
  readInputIntent(time, delta) {
    if (this.controls) return this.controls.read({ scene: this, time, delta });
    const left = this.keys.left.isDown || this.keys.a.isDown;
    const right = this.keys.right.isDown || this.keys.d.isDown;
    const up = this.keys.up.isDown;
    const down = this.keys.down.isDown || this.keys.s.isDown;
    return {
      move: {
        x: (right ? 1 : 0) - (left ? 1 : 0),
        y: (down ? 1 : 0) - (up ? 1 : 0),
      },
      actions: {
        moveLeft: {
          pressed: Phaser.Input.Keyboard.JustDown(this.keys.left)
            || Phaser.Input.Keyboard.JustDown(this.keys.a),
          down: left,
        },
        moveRight: {
          pressed: Phaser.Input.Keyboard.JustDown(this.keys.right)
            || Phaser.Input.Keyboard.JustDown(this.keys.d),
          down: right,
        },
        down: { down },
        jump: {
          pressed: Phaser.Input.Keyboard.JustDown(this.keys.jump)
            || Phaser.Input.Keyboard.JustDown(this.keys.up),
          down: this.keys.jump.isDown || this.keys.up.isDown,
        },
        primary: {
          pressed: Phaser.Input.Keyboard.JustDown(this.keys.primary),
          down: this.keys.primary.isDown,
        },
        interact: {
          pressed: Phaser.Input.Keyboard.JustDown(this.keys.interact),
          down: this.keys.interact.isDown,
        },
      },
      meta: { source: 'keyboard' },
    };
  }
  // Frame hook + gameplay events the game reacts to.
  /** @param {number} _time @param {number} _delta */
  pgeOnTick(_time, _delta) {}
  pgeOnJump() {}
  pgeOnAirJump() { this.pgeOnJump(); } // a mid-air (double) jump; by default counts like any jump
  pgeOnWallJump() { this.pgeOnJump(); } // a jump kicked off a wall; by default counts like any jump
  pgeOnDash(/* dir */) {}
  pgeOnLedgeGrab() {} // caught a ledge and started hanging
  pgeOnMantle() { this.pgeOnJump(); } // climbed up off a hung ledge
  pgeOnLanding(/* fact */) {}
  pgeOnSprint(/* dt */) {}
  pgeOnAreaEnter(/* areaId, entryId */) {} // arrived in a freshly-loaded area (music, a toast…)

  // --- world construction ---------------------------------------------------

  addSolid(rect, color) {
    // rect is top-left based {x,y,w,h}; Arcade shapes are centre-based.
    const r = this.add.rectangle(rect.x + rect.w / 2, rect.y + rect.h / 2, rect.w, rect.h, color);
    this.solids.add(r);
    return r;
  }

  // Populate the (persistent) groups with THIS area's geometry. Called on create and again
  // on every area load, so it only fills the groups — it never creates them.
  buildWorld() {
    // Segmented floor: the gaps between segments are lethal pitfalls (see level.pitKillY).
    for (const seg of this.level.floorSegments || []) this.addSolid(seg, PAL.floor);

    // One-way ("thin") platforms go into their own static group so the collider can treat
    // them specially (land on top, pass through from below / on a drop-through).
    this.platformRects = {};
    for (const p of this.level.platforms || []) {
      if (p.kind === 'thin') {
        const r = this.add
          .rectangle(p.x + p.w / 2, p.y + p.h / 2, p.w, p.h, PAL.thin)
          .setDepth(14);
        this.oneWayPlatforms.add(r); // static group gives it a static body sized to the rect
        this.platformRects[p.id] = r;
      } else {
        const color = PAL[p.kind] || PAL.platform;
        this.platformRects[p.id] = this.addSolid(p, color);
      }
    }

    // Faint world-space control labels drawn on the floor layer — placed where each
    // control is first needed. Their text is level data. Tracked so a load can drop them.
    for (const lb of this.level.labels || []) {
      const t = this.add
        .text(lb.x, lb.y, lb.text, { fontFamily: 'monospace', fontSize: '13px', color: PAL.label })
        .setOrigin(0, 0.5)
        .setDepth(6)
        .setAlpha(0.6);
      this.worldDecor.push(t);
    }
  }

  // --- one-way ("thin") platforms -------------------------------------------
  // The collider's PROCESS callback runs before separation and decides whether this contact
  // counts: pass up through from below, fall through while dropping, otherwise land on top.
  // The COLLIDE callback then flags that we're resting on one, so down+jump can drop through.
  oneWayProcess(player, platform) {
    const pb = player.body;
    return shouldCollideOneWay({
      velocityY: pb.velocity.y,
      prevBottom: pb.bottom - pb.deltaY(), // feet position last frame (deltaY = this frame's move)
      platformTop: platform.body.top,
      grace: ONE_WAY_GRACE,
      dropping: this.time.now < (this.dropThroughUntil || 0),
    });
  }

  onOneWayContact() {
    this._onOneWayContact = true;
  }

  buildPlayer() {
    const s = this.spawnPoint();
    this.player = this.createPlayerObject(s.x, s.y);
    const body = this.player.body;
    body.setCollideWorldBounds(true);
    body.setMaxVelocity(this.moveMaxSpeed(), 2000);
    body.setDragX(this.groundDragX());
    this.playerPresentation?.root?.setDepth?.(50);
    this.player.setDepth?.(50);
  }

  // --- transient reset ------------------------------------------------------

  resetTransient() {
    this.syncTraversalState(this.traversalController.reset(this.player.y));
    this._onOneWayContact = false; // set by the one-way collider each physics step
    this.onOneWay = false;
    // A hang may have suspended gravity; make sure a fresh run starts under normal physics.
    this.player.body.setAllowGravity(true);
    this.player.body.setGravityY(0);
    this.stunUntil = 0;
    this.prevPlayerX = this.player.x;
    this.contextualActions = [];
    this.currentContextualAction = null;
    this.contextualActionActivation = null;
    this.player.setAlpha(1);

    // The game resets its own per-run transient state (and seeds this run's vitals) here.
    this.pgeOnResetTransient();

    // Match the body's speed cap to the freshly-seeded run (exhaustion etc. may change it).
    this.player.body.setMaxVelocity(this.moveMaxSpeed(), 2000);
  }

  // --- area loading (discrete "screen" transitions) -------------------------
  // The world is a graph of AREAS, each its own coordinate space, reached through portals
  // rather than by scrolling one wide plane. A load tears the current area's objects down
  // and builds the target's in their place; the persistent groups, colliders, player,
  // camera, keys and ALL run state (skills, HP, danger, unbanked gains, knowledge) survive.

  // Destroy the current area's world objects so another can be built in their place. Only
  // the group CHILDREN are cleared — the groups (and the colliders bound to them) persist.
  teardownWorld() {
    this.entities.destroyAll(this);
    this.solids.clear(true, true);
    this.oneWayPlatforms.clear(true, true);
    this.movers.clear(true, true);
    for (const o of this.worldDecor) o.destroy();
    this.worldDecor = [];
    this.platformRects = {};
  }

  // Swap the live world to another area — the world half shared by a mid-run transition and
  // a reset that respawns elsewhere. Leaves run state and the player alone (the caller
  // repositions). The subclass returns the target's schema from getLevel(areaId).
  swapWorld(areaId) {
    const nextLevel = this.getLevel(areaId);
    const unregisterTypes = [];
    try {
      for (const [name, EntityType] of Object.entries(nextLevel.entityTypes ?? {})) {
        unregisterTypes.push(this.worldRuntime.registry.register(name, EntityType));
      }
      this.validateLevelContent(nextLevel, `level(${JSON.stringify(areaId)})`);
    } catch (error) {
      for (const unregister of unregisterTypes.reverse()) unregister();
      throw error;
    }
    this.teardownWorld();
    this.level = nextLevel;
    this.currentAreaId = this.level.id ?? areaId;
    this.physics.world.setBounds(0, 0, this.level.world.width, this.level.world.height);
    this.cameras.main.setBounds(0, 0, this.level.world.width, this.level.world.height);
    this.buildWorld();
    this.entities.build(this, this.level.entitySpecs);
    this.pgeOnEntitiesBuilt();
  }

  // A mid-run AREA TRANSITION (a "loading screen"): fade out, swap to `areaId`, drop the
  // player at that area's named `entryId`, fade back in — WITHOUT ending the run. A Portal
  // entity calls this when the player crosses into it.
  enterArea(areaId, entryId) {
    if (!this.areaTransitionController.begin(areaId, entryId)) return;
    this.transitioning = true; // update() early-returns while set, so nothing moves mid-fade
    this.player.body.setVelocity(0, 0);
    const cam = this.cameras.main;
    cam.fadeOut(140, 6, 8, 12);
    this.time.delayedCall(160, () => {
      this.swapWorld(areaId);
      const entry = (this.level.entries && this.level.entries[entryId]) || this.spawnPoint();
      this.player.body.reset(entry.x, entry.y);
      cam.centerOn(entry.x, entry.y);
      this.resetAreaTransient();
      this.pgeOnAreaEnter(areaId, entryId);
      cam.fadeIn(180, 6, 8, 12);
      this.areaTransitionController.complete();
      this.transitioning = false;
    });
  }

  // Clear per-area, per-contact transient state on a load (footing, dash, wall/ledge budgets,
  // checkpoint focus) so nothing leaks across the seam. Run state is deliberately untouched.
  resetAreaTransient() {
    this._onOneWayContact = false;
    this.onOneWay = false;
    this.syncTraversalState(this.traversalController.reset(this.player.y));
    this.player.body.setAllowGravity(true);
    this.player.body.setGravityY(0);
    this.stunUntil = 0;
    this.contextualActions = [];
    this.currentContextualAction = null;
    this.contextualActionActivation = null;
  }

  // Rebuild the obstacle visuals a run may have mutated (opened gate, cleared ledge) plus
  // every instantiated thing (broken barricade, defeated boss, carried collectible) so
  // each run presents fresh. Rebuilding the entity list is a single call — anything the
  // game marks permanently done rebuilds into its done state via each entity's spawn().
  resetObstacles() {
    this.entities.build(this, this.level.entitySpecs);
    this.pgeOnEntitiesBuilt();
  }

  // --- input & movement ------------------------------------------------------

  update(time, delta) {
    // An area load is in progress (fading out/in): hold everything — movement, timers,
    // triggers — until the new area is up and the player is placed.
    if (this.transitioning) return;
    this.inputIntent = createInputIntent(this.readInputIntent(time, delta));
    this.lifecycle.emit('input', { scene: this, time, delta, intent: this.inputIntent });
    if ([...this.simulationGates].some((gate) => gate({ scene: this, time, delta }))) {
      this.lifecycle.emit(lifecycleEvent.tick, { scene: this, time, delta, paused: true });
      return;
    }
    // Recomputed from actions offered by nearby entities and world mechanics.
    this.contextualActions = [];
    this.currentContextualAction = null;

    const body = this.player.body;
    const onGround = body.blocked.down || body.onFloor();
    // Whether we were resting on a one-way ("thin") platform as of the last physics step
    // (set by its collide callback). Read it, then clear so this frame's step re-sets it —
    // same one-frame-latched pattern as body.blocked.down.
    const onOneWay = this._onOneWayContact;
    this._onOneWayContact = false;
    this.onOneWay = onOneWay;
    this.updateTraversal(time, delta, onGround, onOneWay);
    this.lifecycle.emit('afterTraversal', { scene: this, time, delta, onGround, onOneWay });

    // One generic pass drives every autonomous/collectible/moving thing.
    this.entities.update(this, time, delta);
    this.lifecycle.emit('beforeContextualActions', { scene: this, time, delta });
    this.resolveContextualActions(time, delta);
    // The game advances its per-frame systems (map knowledge, danger clock…).
    this.pgeOnTick(time, delta);
    this.lifecycle.emit(lifecycleEvent.tick, { scene: this, time, delta });

    this.pgeUpdatePlayerVisual(time, onGround);

    this.prevPlayerX = this.player.x;
  }

  // Whether a grounded player reads as moving (shared by animation logic).
  get playerMoving() {
    return Math.abs(this.player.body.velocity.x) > RUN_ANIM_MIN_VX;
  }

  // --- headless traversal adapter -------------------------------------------

  traversalConfig() {
    return {
      maxSpeed: this.moveMaxSpeed(),
      accel: this.moveAccel(),
      groundDragX: this.groundDragX(),
      airDragX: this.airDragX(),
      jumpVelocity: this.jumpVelocity(),
      airJumpCount: this.airJumpCount(),
      coyoteMs: this.coyoteMs(),
      jumpBufferMs: this.jumpBufferMs(),
      fastFallGravity: this.fastFallGravity(),
      stunUntil: this.stunUntil,
      dash: this.dashConfig(),
      wall: this.wallSlideConfig(),
      ledge: this.ledgeGrabConfig(),
    };
  }

  traversalBodyState(onGround) {
    const body = this.player.body;
    return {
      x: this.player.x,
      y: this.player.y,
      top: body.top,
      bottom: body.bottom,
      left: body.left,
      right: body.right,
      halfWidth: body.halfWidth,
      halfHeight: body.halfHeight,
      velocityX: body.velocity.x,
      velocityY: body.velocity.y,
      onGround,
      blockedLeft: body.blocked.left,
      blockedRight: body.blocked.right,
    };
  }

  updateTraversal(time, delta, onGround, onOneWay) {
    const solids = this.solids.getChildren().map((solid) => ({
      x: solid.body.left,
      y: solid.body.top,
      w: solid.body.width,
      h: solid.body.height,
    }));
    const result = this.traversalController.step({
      time,
      delta,
      intent: this.inputIntent,
      body: this.traversalBodyState(onGround),
      onOneWay,
      solids,
      config: this.traversalConfig(),
    });
    this.applyTraversalMotion(result.motion);
    this.syncTraversalState(result.state);
    for (const event of result.events) this.handleTraversalEvent(event, time);
  }

  applyTraversalMotion(motion) {
    const body = this.player.body;
    if (motion.allowGravity !== undefined) body.setAllowGravity(motion.allowGravity);
    if (motion.reset) body.reset(motion.reset.x, motion.reset.y);
    if (motion.maxVelocityX !== undefined) body.setMaxVelocity(motion.maxVelocityX, 2000);
    if (motion.velocityX !== undefined) body.setVelocityX(motion.velocityX);
    if (motion.velocityY !== undefined) body.setVelocityY(motion.velocityY);
    if (motion.accelerationX !== undefined) body.setAccelerationX(motion.accelerationX);
    if (motion.dragX !== undefined) body.setDragX(motion.dragX);
    if (motion.gravityY !== undefined) body.setGravityY(motion.gravityY);
  }

  syncTraversalState(state = {}) {
    Object.assign(this, state);
  }

  handleTraversalEvent(event, time) {
    if (event.type === 'dash') {
      this.pgeOnDash(event.dir);
    } else if (event.type === 'jump') {
      if (event.kind === 'ground') this.pgeOnJump();
      else if (event.kind === 'wall') this.pgeOnWallJump();
      else if (event.kind === 'air') this.pgeOnAirJump();
    } else if (event.type === 'ledgeGrab') {
      this.pgeOnLedgeGrab();
    } else if (event.type === 'mantle') {
      this.pgeOnMantle();
    } else if (event.type === 'land') {
      const fact = { drop: event.drop, impactVelocity: event.impactVelocity };
      this.lifecycle.emit('landing', { scene: this, ...fact });
      this.pgeOnLanding(fact);
    } else if (event.type === 'sprint') {
      this.pgeOnSprint(event.delta);
    }
  }

  releaseHang(time) {
    this.traversalController.ledge.release(time, this.ledgeGrabConfig()?.cooldownMs);
    this.syncTraversalState(this.traversalController.ledge.snapshot());
  }

  offerContextualAction(action) {
    if (!action || typeof action.execute !== 'function') {
      throw new TypeError('A contextual action requires an execute function.');
    }
    this.contextualActions.push(action);
    return action;
  }

  /** @returns {{ scene: PlatformerScene, player: any, intent: any, time: number, delta: number }} */
  contextualActionContext(time = this.time.now, delta = 0) {
    return {
      scene: this,
      player: this.player,
      intent: this.inputIntent,
      time,
      delta,
    };
  }

  resolveContextualActions(time, delta) {
    const context = this.contextualActionContext(time, delta);
    const action = selectContextualAction(this.contextualActions, context);
    this.currentContextualAction = action;
    const activation = advanceActionActivation(
      action,
      this.contextualActionActivation,
      this.inputIntent,
      delta,
    );
    this.contextualActionActivation = activation.state;

    if (action?.kind === 'readable') {
      this.nearReadable = { id: action.source?.id ?? action.id, prompt: action.label, action };
    }
    if (activation.triggered) executeContextualAction(action, context);
  }

  // Convenience view over the device-independent intent.
  wasInteractJustPressed() {
    return actionState(this.inputIntent, 'interact').pressed;
  }
}
