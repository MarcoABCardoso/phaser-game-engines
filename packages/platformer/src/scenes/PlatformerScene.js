import Phaser from 'phaser';
import {
  actionState,
  advanceActionActivation,
  createInputIntent,
  executeContextualAction,
  selectContextualAction,
} from '@phaser-game-engines/core';
import { fallDamageForDrop } from '../systems/fall.js';
import {
  shouldCollideOneWay,
  registerTap,
  resolveJump,
  findGrabbableLedge,
} from '../systems/movement.js';
import EntityManager from '../entities/EntityManager.js';
import { BASE_ENTITY_TYPES } from '../entities/registry.js';
import { pointInRect } from '../systems/geometry.js';
import {
  createDialog,
  tickDialog,
  advanceDialog,
  visibleText,
  isTyping,
} from '../systems/dialog.js';

// PlatformerScene — the generic 2D-platformer engine. It owns everything a platformer
// needs regardless of what game is built on top: a segmented floor + platforms, a player
// body that runs/jumps/falls (with tiered stumble-vs-hurt landings), an attack that
// dispatches over attackable entities, HP with i-frames/knockback, generic checkpoints
// (respawn markers you interact with), a world-freezing dialogue system, and the entity
// manager that loops over everything.
//
// It knows NOTHING about this game's rules. Where a decision is game-specific — how high a
// jump is, whether a checkpoint is "lit", what happens when you rest at one, whether
// completing an objective matters — it calls an overridable HOOK or reads a PROVIDER
// (methods below with generic defaults). A game subclasses this scene and overrides those
// to layer its ruleset on, so the engine has zero imports from the game or its content.
//
// The subclass supplies its world through getLevel() (see the LEVEL SCHEMA note there) and
// wires its state up in init().

// --- Engine tuning (generic platformer feel; a game doesn't retune these) ---
const STUMBLE_MIN_DROP = 60; // px fall that registers as a stumble (below the fall-damage threshold)
const STUMBLE_STUN_MS = 170; // brief loss of control on a stumble
const FALL_HURT_STUN_MS = 320; // landing-stun on a damaging fall
const HOLD_MS = 600; // how long a destructive action (rest / abandon) must be held to fire
const ATTACK_COOLDOWN_MS = 260; // min time between landed hits
const ATTACK_REACH = 56; // px beyond an attackable's edges a swing still lands
const JUMP_CUT_MULTIPLIER = 0.45; // upward velocity kept if jump is released while still rising
const ONE_WAY_GRACE = 8; // px slack for landing on a one-way ("thin") platform's top
const ONE_WAY_DROP_MS = 220; // how long a down+jump drop-through ignores one-way platforms
const DASH_DOUBLE_TAP_MS = 260; // max gap between the two taps that trigger a dash
const DASH_DURATION_MS = 170; // how long a dash's velocity override lasts
const DASH_COOLDOWN_MS = 480; // idle time after a dash before another can fire
const WALL_SLIDE_SPEED = 120; // fallback clamped descent speed while wall-sliding
const WALL_JUMP_PUSH_X = 300; // fallback horizontal launch away from the wall
const WALL_JUMP_LOCK_MS = 160; // brief input lock after a wall jump so the push-off holds
const LEDGE_REACH = 12; // fallback px from the wall face a ledge is grabbable
const LEDGE_BAND = 20; // fallback px around the hands a ledge top must sit within
const LEDGE_COOLDOWN_MS = 300; // grace after a mantle/release before re-grabbing
const ATTACK_INDICATOR_H = 50; // height of the attack-range flash rectangle
const ATTACK_INDICATOR_MS = 140; // how long the attack-range flash stays visible
const PLAYER_ATTACK_RECOIL_VX = 170; // player's own recoil on a landed hit, for impact weight
const PLAYER_KNOCKBACK_VX = 260; // default horizontal knockback when something hits the player
const PLAYER_KNOCKBACK_VY = -180; // small upward pop on a hit
const DAMAGE_FLASH_COLOR = 0xff5a4a; // screen-flash colour when the player takes a hit
const INVINCIBLE_FLICKER_MS = 80; // half-period of the i-frame flicker

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
  attackSwing: 0xffe6a8,
  label: '#6b7488',
  checkpointUnlit: 0x4a5168,
  checkpointLit: 0xffe08a,
  thin: 0x6c86a8, // one-way "thin" platform — lighter than a solid so it reads as pass-through
};

export default class PlatformerScene extends Phaser.Scene {
  create() {
    // The subclass initialises its own state (save, run state, dialogue tables) here,
    // before anything that reads it is built.
    this.dialogs = {};
    this.speakers = {};
    this.init();

    // LEVEL SCHEMA (returned by getLevel()): {
    //   world: {width,height}, spawn: {x,y}, pitKillY?,
    //   floorSegments: [{x,y,w,h}], platforms: [{x,y,w,h,kind?}], labels: [{x,y,text}],
    //   checkpoints: [{id, zone, marker, spawn, ...game-specific fields}],
    //   entitySpecs: [...], entityTypes?: {type->Class}, fog?: {...}
    // } — everything about THIS world lives in that data, nothing about it lives here.
    // The game returns the STARTING area's schema (which area that is may depend on the
    // save — the last-rested beacon can live in any area). enterArea(id) fetches others.
    this.level = this.getLevel();
    this.currentAreaId = this.level.id ?? null;
    this.transitioning = false;

    this.physics.world.setBounds(0, 0, this.level.world.width, this.level.world.height);
    this.cameras.main.setBounds(0, 0, this.level.world.width, this.level.world.height);
    this.baseBgColor = Phaser.Display.Color.ValueToColor('#12151d');
    this.redBgColor = Phaser.Display.Color.ValueToColor('#4a1418');

    // Persistent physics groups + the entity manager. They OUTLIVE an area load: a
    // transition clears their children and refills them for the new area, so the
    // player↔world colliders wired once (below) stay valid across every load.
    this.solids = this.physics.add.staticGroup();
    this.oneWayPlatforms = this.physics.add.staticGroup();
    this.movers = this.physics.add.group({ allowGravity: false, immovable: true });
    // World display objects that live outside a group (floor labels, …), tracked so a load
    // can tear them down.
    this.worldDecor = [];
    this.entities = new EntityManager(this.level.entityTypes || BASE_ENTITY_TYPES);

    this.attackReach = ATTACK_REACH; // how far a swing reaches; entities read this
    // Checkpoints revealed in the field this run (e.g. by an enemy on death). Cleared each
    // reset; a permanent reveal is the game's business. Set up before buildCheckpoints.
    this.revealedThisRun = new Set();
    this.buildWorld();
    this.buildCheckpoints();
    this.buildPlayer();
    this.buildAttackIndicator();
    // Everything attackable/collectible/autonomous lives in one instantiated list; the
    // scene loops over it generically. Built after the player so entities can read it.
    this.entities.build(this, this.level.entitySpecs);
    this.onEntitiesBuilt();

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
      attack: Phaser.Input.Keyboard.KeyCodes.F, // swing at an attackable in reach
      interact: Phaser.Input.Keyboard.KeyCodes.E, // light / rest at a checkpoint
      abandon: Phaser.Input.Keyboard.KeyCodes.R, // give up in the field (hold)
    });

    // Per-run transient state (engine + game).
    this.resetTransient();

    this.onReady();
  }

  // --- overridable HOOKS & PROVIDERS (generic defaults; a game overrides) -----
  // Lifecycle
  init() {} // subclass: load save / run state / dialogue tables
  getLevel() { throw new Error('PlatformerScene.getLevel() must be overridden'); }
  onReady() {} // subclass: launch HUD, install debug hooks
  onEntitiesBuilt() {} // subclass: cache typed entity handles for its HUD
  onResetTransient() {} // subclass: reset its own per-run transient state (and vitals)
  runReset() {} // subclass: build a fresh run's state (skills, clock, intro flags)
  saveGame() {} // subclass: persist its save
  // Movement/combat parameters (constants here; a game feeds skill-driven values)
  jumpVelocity() { return -420; }
  moveMaxSpeed() { return 160; }
  moveAccel() { return 900; }
  swingDamage() { return 8; }
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
  // Player-hurt / animation reactions (visual; a game maps these to sprite poses)
  playerReact(/* kind */) {} // 'fall' | 'hurt'
  updatePlayerVisual(/* time, onGround */) {}
  createPlayerObject(x, y) {
    const r = this.add.rectangle(x, y, DEFAULT_BODY_W, DEFAULT_BODY_H, PAL.player);
    this.physics.add.existing(r);
    return r;
  }
  // Where a fresh run begins (a game picks by checkpoint; default is the level spawn).
  spawnPoint() { return this.level.spawn; }
  // Checkpoint state (generic default: lit only if always-lit; always revealed & usable).
  isCheckpointLit(cp) { return Boolean(cp && cp.alwaysLit); }
  isCheckpointRevealed(cp) { return !cp || !cp.hiddenUntilFlag; }
  isCheckpointUsable(/* cp */) { return true; }
  // Escalation tier for spawners etc. (no danger model in the bare engine).
  currentDangerTier() { return 0; }
  /** Override to supply gamepad, touch, AI, network, or replay input. */
  readInputIntent() {
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
          pressed: Phaser.Input.Keyboard.JustDown(this.keys.attack),
          down: this.keys.attack.isDown,
        },
        interact: {
          pressed: Phaser.Input.Keyboard.JustDown(this.keys.interact),
          down: this.keys.interact.isDown,
        },
        abandon: {
          pressed: Phaser.Input.Keyboard.JustDown(this.keys.abandon),
          down: this.keys.abandon.isDown,
        },
      },
      meta: { source: 'keyboard' },
    };
  }
  // Frame hook + gameplay events the game reacts to.
  onTick(/* time, delta */) {}
  onJump() {}
  onAirJump() { this.onJump(); } // a mid-air (double) jump; by default counts like any jump
  onWallJump() { this.onJump(); } // a jump kicked off a wall; by default counts like any jump
  onDash(/* dir */) {}
  onLedgeGrab() {} // caught a ledge and started hanging
  onMantle() { this.onJump(); } // climbed up off a hung ledge
  onSprint(/* dt */) {}
  onAttackLanded(/* target */) {}
  onAtLitCheckpoint(/* cp */) {}
  onCheckpointLit(/* cp */) {}
  onCheckpointRest(/* cp */) {}
  onAbandon() {}
  onAreaEnter(/* areaId, entryId */) {} // arrived in a freshly-loaded area (music, a toast…)
  // An entity completed an objective (breakable boss, artifact pickup). Generic no-op;
  // a game turns it into a bankable/pending gain.
  objectiveGained(/* flag, message */) {}

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
    this.player.setDepth(50);
  }

  // A purely visual reach indicator — flashed on every swing so the player can see their
  // attack range, independent of whether it actually lands a hit.
  buildAttackIndicator() {
    this.attackIndicator = this.add
      .rectangle(this.player.x, this.player.y, ATTACK_REACH, ATTACK_INDICATOR_H, PAL.attackSwing)
      .setDepth(52)
      .setAlpha(0);
  }

  showAttackIndicator(time) {
    const dir = this.facingDir || 1;
    const x = this.player.x + (dir * (this.player.body.width + ATTACK_REACH)) / 2;
    this.attackIndicator.setPosition(x, this.player.y);
    this.attackIndicator.setAlpha(0.4);
    this.attackIndicatorUntil = time + ATTACK_INDICATOR_MS;
  }

  // A landed hit recoils the player a little too — not just the target — so a swing has
  // some weight behind it instead of feeling weightless.
  applyAttackRecoil() {
    const dir = -(this.facingDir || 1);
    this.player.body.setVelocityX(dir * PLAYER_ATTACK_RECOIL_VX);
  }

  // --- checkpoints ----------------------------------------------------------
  // Generic respawn markers: a lit/unlit column at a zone the player can interact with.
  // What "lit" means, and what lighting/resting do, are the game's business (hooks above);
  // the engine only draws them, detects the player at one, and translates input to hooks.

  buildCheckpoints() {
    this.checkpointRects = {};
    for (const c of this.level.checkpoints || []) {
      const m = c.marker;
      const rect = this.add
        .rectangle(m.x + m.w / 2, m.y + m.h / 2, m.w, m.h, PAL.checkpointUnlit)
        .setDepth(16);
      this.checkpointRects[c.id] = rect;
      this.refreshCheckpointVisual(c);
    }
  }

  refreshCheckpointVisual(cp) {
    const rect = this.checkpointRects[cp.id];
    if (!rect) return;
    if (!this.isCheckpointRevealed(cp)) {
      rect.setAlpha(0);
      return;
    }
    const lit = this.isCheckpointLit(cp);
    rect.setFillStyle(lit ? PAL.checkpointLit : PAL.checkpointUnlit);
    rect.setAlpha(lit ? 0.95 : 0.4);
  }

  checkpointById(id) {
    return (this.level.checkpoints || []).find((c) => c.id === id) || null;
  }

  checkpointAt(x, y) {
    for (const c of this.level.checkpoints || []) {
      if (!this.isCheckpointRevealed(c)) continue;
      if (pointInRect(x, y, c.zone)) return c;
    }
    return null;
  }

  revealCheckpointThisRun(id) {
    this.revealedThisRun.add(id);
  }

  // --- per-run reset ---------------------------------------------------------

  resetTransient() {
    this.groundY = this.player.y; // y of the surface we're currently standing on
    this.takeoffY = this.player.y; // y of the surface we last launched from
    this.wasAirborne = false;
    this.jumpHeldLastFrame = false;
    this.facingDir = 1;
    // Extended-movement transient state (double jump / dash / one-way drop-through, plus
    // coyote time, jump buffering, wall slide/jump, fast fall, and ledge grab).
    this.airJumpsUsed = 0;
    this.airDashesUsed = 0;
    this.dashUntil = 0;
    this.dashCooldownUntil = 0;
    this.dashDir = 1;
    this.dropThroughUntil = 0;
    this.coyoteUntil = 0;
    this.jumpBufferedUntil = 0;
    this.wallJumpLockUntil = 0;
    this.wallSliding = false;
    this.hanging = null; // { dir, top, faceX } while clinging to a ledge, else null
    this.ledgeCooldownUntil = 0;
    this._tapState = null; // last direction tap seen, for dash double-tap detection
    this._onOneWayContact = false; // set by the one-way collider each physics step
    this.onOneWay = false;
    // A hang may have suspended gravity; make sure a fresh run starts under normal physics.
    this.player.body.setAllowGravity(true);
    this.player.body.setGravityY(0);
    this.attackIndicatorUntil = 0;
    if (this.attackIndicator) this.attackIndicator.setAlpha(0);
    this.stunUntil = 0;
    this.prevPlayerX = this.player.x;
    this.runEnding = false;
    this.runMessage = '';
    this.currentCheckpoint = null;
    this.atLitCheckpoint = false;
    // Dialogue never persists across a reset (the world was frozen while it was open).
    this.dialogState = null;
    this.dialogOnDone = null;
    this.nearReadable = null;
    this.contextualActions = [];
    this.currentContextualAction = null;
    this.contextualActionActivation = null;
    this.abandonActionActivation = null;
    this.playerInvincibleUntil = 0;
    this.player.setAlpha(1);

    // The game resets its own per-run transient state (and seeds this run's vitals) here.
    this.onResetTransient();

    // Match the body's speed cap to the freshly-seeded run (exhaustion etc. may change it).
    this.player.body.setMaxVelocity(this.moveMaxSpeed(), 2000);
  }

  resetRun() {
    this.runReset();
    const s = this.spawnPoint();
    // A run may respawn in a DIFFERENT area than the one it ended in (the player last rested
    // at a beacon in another room). If so, load that area's world; otherwise just rebuild the
    // obstacles in place. Either way the player lands at the spawn point.
    const area = s.area ?? this.currentAreaId;
    if (area !== this.currentAreaId) this.swapWorld(area);
    else this.resetObstacles();
    this.player.body.reset(s.x, s.y);
    this.cameras.main.setBackgroundColor(this.baseBgColor.color);
    this.cameras.main.centerOn(s.x, s.y);
    this.resetTransient();
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
    for (const id of Object.keys(this.checkpointRects || {})) this.checkpointRects[id].destroy();
    this.checkpointRects = {};
    for (const o of this.worldDecor) o.destroy();
    this.worldDecor = [];
    this.platformRects = {};
  }

  // Swap the live world to another area — the world half shared by a mid-run transition and
  // a reset that respawns elsewhere. Leaves run state and the player alone (the caller
  // repositions). The subclass returns the target's schema from getLevel(areaId).
  swapWorld(areaId) {
    this.teardownWorld();
    this.level = this.getLevel(areaId);
    this.currentAreaId = this.level.id ?? areaId;
    this.physics.world.setBounds(0, 0, this.level.world.width, this.level.world.height);
    this.cameras.main.setBounds(0, 0, this.level.world.width, this.level.world.height);
    this.revealedThisRun.clear();
    this.buildWorld();
    this.buildCheckpoints();
    this.entities.build(this, this.level.entitySpecs);
    this.onEntitiesBuilt();
  }

  // A mid-run AREA TRANSITION (a "loading screen"): fade out, swap to `areaId`, drop the
  // player at that area's named `entryId`, fade back in — WITHOUT ending the run. A Portal
  // entity calls this when the player crosses into it.
  enterArea(areaId, entryId) {
    if (this.transitioning || this.runEnding) return;
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
      this.onAreaEnter(areaId, entryId);
      cam.fadeIn(180, 6, 8, 12);
      this.transitioning = false;
    });
  }

  // Clear per-area, per-contact transient state on a load (footing, dash, wall/ledge budgets,
  // checkpoint focus) so nothing leaks across the seam. Run state is deliberately untouched.
  resetAreaTransient() {
    this._onOneWayContact = false;
    this.onOneWay = false;
    this.hanging = false;
    this.wallSliding = false;
    this.dashUntil = 0;
    this.airJumpsUsed = 0;
    this.airDashesUsed = 0;
    this.jumpBufferedUntil = 0;
    this.coyoteUntil = 0;
    this.stunUntil = 0;
    this.currentCheckpoint = null;
    this.atLitCheckpoint = false;
    this.contextualActions = [];
    this.currentContextualAction = null;
    this.contextualActionActivation = null;
    this.abandonActionActivation = null;
  }

  // Rebuild the obstacle visuals a run may have mutated (opened gate, cleared ledge) plus
  // every instantiated thing (broken barricade, defeated boss, carried collectible) so
  // each run presents fresh. Rebuilding the entity list is a single call — anything the
  // game marks permanently done rebuilds into its done state via each entity's spawn().
  resetObstacles() {
    this.revealedThisRun.clear();
    this.entities.build(this, this.level.entitySpecs);
    this.onEntitiesBuilt();
    // Checkpoint lit-state may have changed since create, so repaint each marker.
    for (const c of this.level.checkpoints || []) this.refreshCheckpointVisual(c);
  }

  // --- input & movement ------------------------------------------------------

  update(time, delta) {
    if (this.runEnding) return;
    // An area load is in progress (fading out/in): hold everything — movement, timers,
    // triggers — until the new area is up and the player is placed.
    if (this.transitioning) return;
    this.inputIntent = createInputIntent(this.readInputIntent(time, delta));
    // Dialogue freezes the world: while a conversation is open we only tick the typewriter
    // and read the advance key, and return before any movement, timer, enemy, hazard, or
    // trigger runs. This is the "dialogue pauses everything" rule.
    if (this.dialogState) {
      this.updateDialog(time, delta);
      return;
    }

    // Recomputed from actions offered by nearby entities and world mechanics.
    this.contextualActions = [];
    this.currentContextualAction = null;
    this.nearReadable = null;

    const dt = delta / 1000;
    const body = this.player.body;
    const onGround = body.blocked.down || body.onFloor();
    // Whether we were resting on a one-way ("thin") platform as of the last physics step
    // (set by its collide callback). Read it, then clear so this frame's step re-sets it —
    // same one-frame-latched pattern as body.blocked.down.
    const onOneWay = this._onOneWayContact;
    this._onOneWayContact = false;
    this.onOneWay = onOneWay;
    const stunned = time < this.stunUntil;

    const left = this.inputIntent.move.x < 0;
    const right = this.inputIntent.move.x > 0;
    const down = actionState(this.inputIntent, 'down').down;
    const jumpPressed = actionState(this.inputIntent, 'jump').pressed;
    const jumpHeld = actionState(this.inputIntent, 'jump').down;
    const attackPressed = actionState(this.inputIntent, 'primary').pressed;

    // Back on solid ground: refill the air-jump and air-dash budgets and re-arm the coyote
    // window (a short grace to still ground-jump just after walking off a ledge).
    if (onGround) {
      this.airJumpsUsed = 0;
      this.airDashesUsed = 0;
      this.coyoteUntil = time + this.coyoteMs();
    }

    // A fresh jump press arms a short buffer, so a press just before landing still fires;
    // a buffered press counts as "queued" until it's consumed or lapses.
    if (jumpPressed) this.jumpBufferedUntil = time + this.jumpBufferMs();
    const jumpQueued = jumpPressed || time < (this.jumpBufferedUntil || 0);

    if (this.hanging) {
      // Clinging to a ledge freezes normal movement — only mantle (jump) or drop (down) act.
      this.updateHang(time, jumpQueued, down);
      this.jumpHeldLastFrame = jumpHeld;
    } else {
      // Dash is a double-tap of a direction (detected on the key edge). Gated by stun.
      if (!stunned) this.updateDashInput(time, onGround);
      const dashing = time < (this.dashUntil || 0);
      const inputLocked = time < (this.wallJumpLockUntil || 0); // brief hold after a wall jump

      // Facing: dash direction while dashing, else last direction pressed.
      if (dashing) this.facingDir = this.dashDir;
      else if (left && !right) this.facingDir = -1;
      else if (right && !left) this.facingDir = 1;

      // Movement speed/accel come from the game (which may slow a walk, scale a run skill…).
      const maxSpeed = this.moveMaxSpeed();
      const accel = this.moveAccel();

      if (dashing) {
        // A dash overrides normal control: a fixed velocity in the dash direction, momentum
        // held (drag off) and the speed cap lifted to let it exceed the run's top speed.
        const speed = this.dashConfig().speed;
        body.setMaxVelocity(Math.max(maxSpeed, speed), 2000);
        body.setVelocityX(this.dashDir * speed);
        body.setAccelerationX(0);
        body.setDragX(0);
      } else {
        body.setMaxVelocity(maxSpeed, 2000);
        // Drag only on the ground: in the air momentum is kept, so a running jump or a drop
        // carries its horizontal speed instead of bleeding it off when the key is released.
        body.setDragX(onGround ? this.groundDragX() : this.airDragX());
        if (!stunned && !inputLocked && left && !right) body.setAccelerationX(-accel);
        else if (!stunned && !inputLocked && right && !left) body.setAccelerationX(accel);
        else body.setAccelerationX(0);
      }

      // Fast fall: holding down in the air adds gravity so the descent is snappier.
      const extraG = this.fastFallGravity();
      body.setGravityY(!dashing && !onGround && down && extraG > 0 ? extraG : 0);

      // Wall slide: pressing into a wall while falling clamps the descent speed.
      const wallDir = body.blocked.left ? -1 : body.blocked.right ? 1 : 0;
      const wallCfg = this.wallSlideConfig();
      const pressingWall = (wallDir === -1 && left) || (wallDir === 1 && right);
      const sliding = Boolean(wallCfg) && !onGround && wallDir !== 0 && pressingWall && body.velocity.y > 0;
      if (sliding) {
        const slideSpeed = wallCfg.slideSpeed ?? WALL_SLIDE_SPEED;
        if (body.velocity.y > slideSpeed) body.setVelocityY(slideSpeed);
      }
      this.wallSliding = sliding;

      // Jump / drop-through / wall-jump / air-jump. Full height only comes from holding the
      // button; releasing early while still rising cuts the ascent short (jump-cut below).
      let acted = false;
      if (!stunned && jumpQueued) {
        const kind = resolveJump({
          onGround,
          coyoteOk: time < (this.coyoteUntil || 0),
          dropRequested: down,
          onOneWay,
          touchingWallDir: wallDir,
          wallJumpEnabled: Boolean(wallCfg),
          airJumpsUsed: this.airJumpsUsed,
          airJumpAllowance: this.airJumpCount(),
        });
        if (kind === 'drop') {
          // Down+jump on a one-way platform: ignore one-way collisions briefly and fall through.
          this.dropThroughUntil = time + ONE_WAY_DROP_MS;
          acted = true;
        } else if (kind === 'ground') {
          body.setVelocityY(this.jumpVelocity());
          this.coyoteUntil = 0; // consume — no coyote-jump after already jumping
          this.onJump();
          acted = true;
        } else if (kind === 'wall') {
          const away = -wallDir;
          body.setVelocityY(this.jumpVelocity());
          body.setVelocityX(away * (wallCfg.jumpPushX ?? WALL_JUMP_PUSH_X));
          this.wallJumpLockUntil = time + (wallCfg.lockMs ?? WALL_JUMP_LOCK_MS);
          this.airJumpsUsed = 0; // a wall jump refreshes the air-jump budget
          this.onWallJump();
          acted = true;
        } else if (kind === 'air') {
          body.setVelocityY(this.jumpVelocity());
          this.airJumpsUsed += 1;
          this.onAirJump();
          acted = true;
        }
        if (acted) {
          this.jumpBufferedUntil = 0; // consumed
          if (dashing) this.dashUntil = time; // dash-cancel into a jump (momentum carries)
        }
      }
      if (!acted && !jumpHeld && this.jumpHeldLastFrame && body.velocity.y < 0) {
        body.setVelocityY(body.velocity.y * JUMP_CUT_MULTIPLIER);
      }
      this.jumpHeldLastFrame = jumpHeld;

      // Sprinting on the ground — the game may grant xp for it (not while dashing).
      if (!dashing && onGround && Math.abs(body.velocity.x) >= 0.6 * maxSpeed) {
        this.onSprint(dt);
      }

      // Ledge grab: airborne and reaching toward a wall's top corner -> catch and hang.
      if (!dashing && !onGround) this.tryLedgeGrab(time, left, right);
    }

    if (!stunned && !this.hanging && attackPressed) {
      this.showAttackIndicator(time);
      this.handleAttack(time);
    }
    // A landed hit may have felled an enemy and opened its dialogue (as may a pickup or a
    // sign, below) — bail the moment a conversation starts so the rest of the frame's
    // world sim doesn't run against a now-frozen world.
    if (this.dialogState) return;

    // A fall down a pitfall (past the floor line, into a gap) is lethal — end the run.
    if (this.level.pitKillY != null && this.player.y > this.level.pitKillY) {
      this.endRun('You fall into the dark. The run ends.');
      return;
    }

    this.updateFallDamage(onGround);
    // One generic pass drives every autonomous/collectible/moving thing.
    this.entities.update(this, time, delta);
    if (this.dialogState) return;
    this.updateCheckpoints(delta);
    this.resolveContextualActions(time, delta);
    this.updateAbandonAction(delta);
    if (this.dialogState) return;
    // The game advances its per-frame systems (map knowledge, danger clock…).
    this.onTick(time, delta);

    this.updatePlayerVisual(time, onGround);

    // Flicker while invincible, so a hit visibly reads as "safe for a moment."
    const invincible = this.isPlayerInvincible(time);
    this.player.setAlpha(
      invincible ? (Math.floor(time / INVINCIBLE_FLICKER_MS) % 2 === 0 ? 0.35 : 1) : 1,
    );

    if (time > (this.attackIndicatorUntil || 0)) this.attackIndicator.setAlpha(0);

    this.prevPlayerX = this.player.x;
  }

  // Whether a grounded player reads as moving (shared by animation logic).
  get playerMoving() {
    return Math.abs(this.player.body.velocity.x) > RUN_ANIM_MIN_VX;
  }

  // --- dash (double-tap a direction) ----------------------------------------

  // Watch the two direction keys for a double tap and fire a dash when one lands.
  updateDashInput(time, onGround) {
    const cfg = this.dashConfig();
    if (!cfg || !cfg.enabled) return;
    const windowMs = cfg.doubleTapMs || DASH_DOUBLE_TAP_MS;
    const edges = [
      [-1, actionState(this.inputIntent, 'moveLeft').pressed],
      [1, actionState(this.inputIntent, 'moveRight').pressed],
    ];
    for (const [dir, pressed] of edges) {
      if (!pressed) continue;
      const { state, dashed } = registerTap(this._tapState, dir, time, windowMs);
      this._tapState = state;
      if (dashed) this.startDash(time, dir, onGround, cfg);
    }
  }

  startDash(time, dir, onGround, cfg) {
    if (time < (this.dashCooldownUntil || 0)) return; // still cooling down
    if (!onGround) {
      if (!cfg.airborne) return; // airborne dashing may be disabled
      const allowance = cfg.airDashes ?? 1; // limited air dashes, refreshed on landing
      if (this.airDashesUsed >= allowance) return;
      this.airDashesUsed += 1;
    }
    this.dashDir = dir;
    this.dashUntil = time + (cfg.durationMs || DASH_DURATION_MS);
    this.dashCooldownUntil = this.dashUntil + (cfg.cooldownMs || DASH_COOLDOWN_MS);
    if (cfg.iFrames) {
      const ms = cfg.iFrameMs || cfg.durationMs || DASH_DURATION_MS;
      this.playerInvincibleUntil = Math.max(this.playerInvincibleUntil || 0, time + ms);
    }
    this.onDash(dir);
  }

  // --- ledge grab / mantle ---------------------------------------------------
  // Airborne and reaching toward a wall whose top sits near the hands -> catch it and hang
  // (gravity suspended). Jump mantles up onto the ledge; down releases. Geometry decision is
  // the pure findGrabbableLedge over the static solids.

  tryLedgeGrab(time, left, right) {
    const cfg = this.ledgeGrabConfig();
    if (!cfg) return;
    if (time < (this.ledgeCooldownUntil || 0)) return;
    const body = this.player.body;
    if (body.velocity.y < -20) return; // only while falling or near the apex, not rising fast
    const dir = right && !left ? 1 : left && !right ? -1 : 0;
    if (dir === 0) return;
    const solids = this.solids.getChildren().map((c) => ({
      x: c.body.left,
      y: c.body.top,
      w: c.body.width,
      h: c.body.height,
    }));
    const ledge = findGrabbableLedge({
      playerTop: body.top,
      playerBottom: body.bottom,
      playerLeft: body.left,
      playerRight: body.right,
      dir,
      solids,
      reach: cfg.reach ?? LEDGE_REACH,
      band: cfg.band ?? LEDGE_BAND,
    });
    if (!ledge) return;
    this.hanging = { dir, top: ledge.top, faceX: ledge.faceX };
    body.setAllowGravity(false);
    body.setVelocity(0, 0);
    body.setAcceleration(0, 0);
    body.setGravityY(0);
    // Freeze the fall bookkeeping at the grab so the eventual mantle doesn't read as a fall.
    this.takeoffY = this.player.y;
    this.groundY = this.player.y;
    this.wasAirborne = false;
    this.onLedgeGrab();
  }

  updateHang(time, jumpQueued, down) {
    const body = this.player.body;
    const h = this.hanging;
    body.setVelocity(0, 0);
    body.setAcceleration(0, 0);
    body.setAllowGravity(false);
    this.facingDir = h.dir;
    if (jumpQueued) {
      // Mantle: pop up onto the ledge (feet on its top, just past the face) and resume physics.
      body.setAllowGravity(true);
      const newX = h.faceX + h.dir * (body.halfWidth + 3);
      const newY = h.top - body.halfHeight - 1;
      body.reset(newX, newY);
      this.releaseHang(time);
      this.takeoffY = this.player.y;
      this.groundY = this.player.y;
      this.wasAirborne = false;
      this.jumpBufferedUntil = 0;
      this.onMantle();
    } else if (down) {
      body.setAllowGravity(true);
      this.releaseHang(time);
    }
  }

  releaseHang(time) {
    this.hanging = null;
    this.ledgeCooldownUntil = time + LEDGE_COOLDOWN_MS;
  }

  // --- tiered failure: stumble vs bad fall ----------------------------------

  updateFallDamage(onGround) {
    if (!onGround) {
      // On the frame we leave the ground, latch the surface we launched from.
      if (!this.wasAirborne) this.takeoffY = this.groundY;
      this.wasAirborne = true;
      return;
    }
    if (this.wasAirborne) {
      // Fall damage is a pure function of how far we landed BELOW the takeoff surface.
      // Measuring against the takeoff point (not the arc's apex) means a jump's own rise
      // never counts. Only real descent past the threshold costs HP, scaled by distance.
      const drop = this.player.y - this.takeoffY;
      const hp = fallDamageForDrop(drop);
      if (hp > 0) {
        this.damage(hp);
        this.stunUntil = this.time.now + FALL_HURT_STUN_MS;
        // A crumpled pose reads a hard fall better than a screen flash — no flash here,
        // just the pose (game-supplied) held through the landing stun.
        this.playerReact('fall');
      } else if (drop >= STUMBLE_MIN_DROP) {
        // Stumble: costs a moment and momentum, no HP — no flash either, since a stumble
        // isn't damage and flashing on every ordinary short drop reads as too punishing.
        this.stunUntil = this.time.now + STUMBLE_STUN_MS;
        this.player.body.setVelocityX(this.player.body.velocity.x * 0.2);
      }
    }
    this.groundY = this.player.y;
    this.wasAirborne = false;
  }

  // --- attackable surfaces ---------------------------------------------------

  // One code path for every swing, whatever it hits. The entity list resolves the target
  // (first attackable surface in reach); the scene owns the swing bookkeeping that's the
  // same for any target — cooldown, recoil, flash, damage. The game reacts to a landed
  // hit (e.g. attack-skill xp) via onAttackLanded, and supplies the damage via swingDamage.
  handleAttack(time) {
    if (time - (this.lastAttackAt || 0) < ATTACK_COOLDOWN_MS) return;
    const target = this.entities.attackableInReach(this);
    if (!target) return;

    this.lastAttackAt = time;
    // Notify before reading damage, so a hit that raises the attack skill applies to itself.
    this.onAttackLanded(target);
    target.onHit(this, this.swingDamage());
    this.applyAttackRecoil();
    this.flash(0xffb066);
  }

  // --- checkpoints: interact / hold-to-rest / abandon -----------------------

  updateCheckpoints(delta) {
    let cp = this.checkpointAt(this.player.x, this.player.y);
    // The game may suppress a checkpoint (e.g. the origin during an exhausted intro).
    if (cp && !this.isCheckpointUsable(cp)) cp = null;
    this.currentCheckpoint = cp;
    this.atLitCheckpoint = cp ? this.isCheckpointLit(cp) : false;

    // Standing in a lit checkpoint is a game event (banking, danger pause…).
    if (this.atLitCheckpoint) this.onAtLitCheckpoint(cp);

    // An unlit checkpoint is an immediate action. Resting at a lit checkpoint is
    // deliberately held; both compete normally with actions offered by entities.
    if (cp && !this.atLitCheckpoint) {
      this.offerContextualAction({
        id: `checkpoint:light:${cp.id}`,
        label: cp.lightLabel ?? 'Light checkpoint',
        priority: cp.interactionPriority ?? 20,
        source: cp,
        execute: () => this.onCheckpointLit(cp),
      });
    } else if (cp && this.atLitCheckpoint) {
      this.offerContextualAction({
        id: `checkpoint:rest:${cp.id}`,
        label: cp.restLabel ?? 'Rest at checkpoint',
        priority: cp.interactionPriority ?? 20,
        source: cp,
        activation: { action: 'interact', mode: 'hold', durationMs: HOLD_MS },
        execute: () => this.onCheckpointRest(cp),
      });
    }
  }

  offerContextualAction(action) {
    if (!action || typeof action.execute !== 'function') {
      throw new TypeError('A contextual action requires an execute function.');
    }
    this.contextualActions.push(action);
    return action;
  }

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

  updateAbandonAction(delta) {
    const action = {
      id: 'abandon-run',
      activation: { action: 'abandon', mode: 'hold', durationMs: HOLD_MS },
      execute: () => this.onAbandon(),
    };
    const activation = advanceActionActivation(
      action,
      this.abandonActionActivation,
      this.inputIntent,
      delta,
    );
    this.abandonActionActivation = activation.state;
    if (activation.triggered) executeContextualAction(action, this.contextualActionContext());
  }

  // --- dialogue --------------------------------------------------------------
  // Keep a small state cursor (systems/dialog.js) over a conversation looked up by id in
  // the game-supplied tables (this.dialogs / this.speakers), freeze the world while it's
  // open (the guard at the top of update), and let the interact key skip/advance. Triggers
  // just call scene.startDialog('id'); nothing here knows a line of text.

  get dialogActive() {
    return Boolean(this.dialogState);
  }

  // Whether the interact key's edge fired this frame — the single read shared by the
  // checkpoint logic and readables (signs), so they don't fight over JustDown.
  wasInteractJustPressed() {
    return actionState(this.inputIntent, 'interact').pressed;
  }

  startDialog(id, onDone = null) {
    const convo = this.dialogs[id];
    // Guard: unknown id, or one already open (two triggers on the same frame — the first
    // wins, the second is dropped rather than stacking).
    if (!convo || this.dialogState) return;
    this.dialogState = createDialog(convo.turns);
    this.dialogOnDone = onDone;
    // Kill momentum so the player doesn't drift while the world is frozen / on resume.
    this.player.body.setVelocity(0, 0);
    this.player.body.setAcceleration(0, 0);
  }

  updateDialog(time, delta) {
    tickDialog(this.dialogState, delta);
    if (actionState(this.inputIntent, 'interact').pressed) {
      advanceDialog(this.dialogState);
      if (this.dialogState.done) this.endDialog();
    }
  }

  endDialog() {
    const onDone = this.dialogOnDone;
    this.dialogState = null;
    this.dialogOnDone = null;
    if (onDone) onDone();
  }

  // The read-only view a HUD renders from: the current speaker (resolved to name + colour +
  // optional portrait), the visible (typed-so-far) text, and — for the two-portrait layout
  // — whoever last spoke on each side, so both portraits persist through an exchange with
  // the active one lit.
  dialogView() {
    const st = this.dialogState;
    if (!st) return null;
    const turns = st.turns;
    const turn = turns[st.index];
    const resolve = (id) => {
      const s = this.speakers[id] || {};
      return { name: s.name || '', color: s.color || '#ffffff', portrait: s.portrait || null };
    };
    let leftId = null;
    let rightId = null;
    for (let i = 0; i <= st.index; i += 1) {
      if (turns[i].side === 'right') rightId = turns[i].speaker;
      else leftId = turns[i].speaker;
    }
    return {
      side: turn.side === 'right' ? 'right' : 'left',
      speaker: resolve(turn.speaker),
      text: visibleText(st),
      typing: isTyping(st),
      left: leftId ? resolve(leftId) : null,
      right: rightId ? resolve(rightId) : null,
      index: st.index,
      count: turns.length,
    };
  }

  // --- HP / combat / messaging / run end -------------------------------------

  // Whether the player currently has i-frames (safe from contact). Enemies query this
  // before landing a hit; the flicker in update() reads it too.
  isPlayerInvincible(time = this.time.now) {
    return time < (this.playerInvincibleUntil || 0);
  }

  // The single "something hurts the player" path. Every enemy and hazard funnels through
  // here instead of re-implementing the reaction: apply damage, then the knobs each threat
  // cares about — i-frames (so contact can't chain-stun), a movement stun, knockback away
  // from `fromX`, a screen flash, and a flinch pose (game-supplied via playerReact).
  hurtPlayer({
    damage = 1,
    message,
    fromX,
    knockbackVx = PLAYER_KNOCKBACK_VX,
    knockbackVy = PLAYER_KNOCKBACK_VY,
    invincibleMs = 0,
    stunMs = 0,
    flashColor = DAMAGE_FLASH_COLOR,
  } = {}) {
    const time = this.time.now;
    this.damage(damage, message);
    // A hit interrupts a dash and knocks the player off a ledge — the knockback below then
    // takes over, instead of the move's own velocity fighting it.
    this.dashUntil = 0;
    if (this.hanging) {
      this.player.body.setAllowGravity(true);
      this.releaseHang(time);
    }
    if (invincibleMs) this.playerInvincibleUntil = time + invincibleMs;
    if (stunMs) this.stunUntil = time + stunMs;
    if (fromX !== undefined) {
      const dir = Math.sign(this.player.x - fromX) || 1;
      this.player.body.setVelocity(dir * knockbackVx, knockbackVy);
    }
    if (flashColor) this.flash(flashColor);
    this.playerReact('hurt');
  }

  damage(amount, msg) {
    if (this.runEnding) return;
    this.hp = Math.max(0, this.hp - amount);
    if (msg) this.setMessage(msg);
    if (this.hp <= 0) {
      this.endRun('HP depleted. The run ends.');
    }
  }

  // A brief full-screen colour flash. Takes a 0xRRGGBB colour; Phaser's 5th arg is `force`,
  // not an alpha, so there's no intensity knob to thread through here.
  flash(color) {
    this.cameras.main.flash(160, (color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff, false);
  }

  setMessage(msg) {
    this.runMessage = msg;
    this.runMessageUntil = this.time.now + 2600;
  }

  endRun(reason) {
    if (this.runEnding) return;
    this.runEnding = true;
    this.saveGame();
    this.setMessage(reason);
    this.player.body.setVelocity(0, 0);
    this.player.body.setAcceleration(0, 0);
    this.cameras.main.flash(220, 40, 10, 12);
    this.time.delayedCall(900, () => {
      this.resetRun();
    });
  }
}
