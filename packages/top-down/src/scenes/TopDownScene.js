import Phaser from 'phaser';
import {
  actionState,
  advanceActionActivation,
  createLifecycle,
  createMechanicHost,
  createWorldRuntime,
  createInputIntent,
  executeContextualAction,
  lifecycleEvent,
  runCleanups,
  selectContextualAction,
  validateRect,
} from '@phaser-game-engines/core';
import EntityManager from '../entities/EntityManager.js';
import { BASE_ENTITY_TYPES } from '../entities/registry.js';
import { facingFromVelocity, movementFromIntent } from '../systems/movement.js';

/** Extend this scene and return a level with world, spawn, walls, and entitySpecs. */
export default class TopDownScene extends Phaser.Scene {
  constructor(config = {}) {
    super(config);
    this.entityTypes = config.entityTypes;
    this.configuredMechanics = [...(config.mechanics ?? [])];
    this.worldRuntimeOptions = config.worldRuntime ?? {};
    this.lifecycle = createLifecycle();
    this.mechanicHost = createMechanicHost(this);
  }

  getLevel() { throw new Error('TopDownScene subclasses must implement getLevel()'); }
  moveSpeed() { return 210; }
  statusText() { return ''; }
  getMechanics() { return this.configuredMechanics; }

  create() {
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      runCleanups([
        () => this.lifecycle.emit(lifecycleEvent.shutdown, { scene: this }),
        () => this.mechanicHost.clear(),
        () => this.entities?.destroyAll(this),
      ], 'Top-down scene shutdown failed.');
    });
    this.level = this.getLevel();
    this.transitioning = false;
    const types = {
      ...BASE_ENTITY_TYPES,
      ...(this.level.entityTypes ?? {}),
      ...(this.entityTypes ?? {}),
    };
    this.worldRuntime = createWorldRuntime({
      ...this.worldRuntimeOptions,
      types,
      EntityStoreType: EntityManager,
      clock: this.worldRuntimeOptions.clock ?? (() => this.time.now),
    });
    this.worldRuntime.validateLevel(this.level, {
      validateExtension: (level, { path, fail }) => {
        if (level.walls !== undefined && !Array.isArray(level.walls)) {
          fail(`${path}.walls`, 'expected an array.');
        }
        (level.walls ?? []).forEach((wall, index) => {
          validateRect(wall, { path: `${path}.walls[${index}]` });
        });
      },
    });
    for (const mechanic of this.getMechanics()) this.mechanicHost.install(mechanic);

    const { width, height } = this.level.world;
    this.physics.world.setBounds(0, 0, width, height);
    this.cameras.main.setBounds(0, 0, width, height);
    this.solids = this.physics.add.staticGroup();
    for (const wall of this.level.walls ?? []) this.addSolid(wall, wall.color ?? 0x374151);

    // A native rectangle keeps the player body independent from game textures.
    this.player = this.add
      .rectangle(this.level.spawn.x, this.level.spawn.y, 22, 22, 0x6bb8ff)
      .setDepth(10);
    this.physics.add.existing(this.player);
    this.player.body.setCircle(11);
    this.player.body.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.solids);

    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setDeadzone(
      this.level.camera?.deadzoneWidth ?? 0,
      this.level.camera?.deadzoneHeight ?? 0,
    );

    this.keys = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      interact: Phaser.Input.Keyboard.KeyCodes.E,
      attack: Phaser.Input.Keyboard.KeyCodes.SPACE,
    }, true);
    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.keyboard.addCapture([
      Phaser.Input.Keyboard.KeyCodes.UP,
      Phaser.Input.Keyboard.KeyCodes.DOWN,
      Phaser.Input.Keyboard.KeyCodes.LEFT,
      Phaser.Input.Keyboard.KeyCodes.RIGHT,
      Phaser.Input.Keyboard.KeyCodes.SPACE,
    ]);

    this.contextualActions = [];
    this.contextualActionActivation = null;
    this.entities = this.worldRuntime.entities;
    this.entities.build(this, this.level.entitySpecs);
    this.prompt = this.add.text(12, 12, '', {
      fontFamily: 'sans-serif',
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#00000099',
      padding: { x: 6, y: 4 },
    }).setScrollFactor(0).setDepth(100);
    this.lifecycle.emit(lifecycleEvent.ready, { scene: this });
  }

  addSolid(rect, color = 0x374151) {
    const block = this.add.rectangle(
      rect.x + rect.w / 2,
      rect.y + rect.h / 2,
      rect.w,
      rect.h,
      color,
    );
    this.physics.add.existing(block, true);
    this.solids.add(block);
    return block;
  }

  /**
   * Phaser keyboard adapter for the engine's device-independent input contract.
   * Games may override this to provide gamepad, touch, AI, network, or replay input.
   */
  readInputIntent() {
    const left = this.keys.left.isDown || this.cursors.left.isDown;
    const right = this.keys.right.isDown || this.cursors.right.isDown;
    const up = this.keys.up.isDown || this.cursors.up.isDown;
    const down = this.keys.down.isDown || this.cursors.down.isDown;
    return {
      move: {
        x: (right ? 1 : 0) - (left ? 1 : 0),
        y: (down ? 1 : 0) - (up ? 1 : 0),
      },
      actions: {
        interact: {
          pressed: Phaser.Input.Keyboard.JustDown(this.keys.interact),
          down: this.keys.interact.isDown,
        },
        primary: {
          pressed: Phaser.Input.Keyboard.JustDown(this.keys.attack),
          down: this.keys.attack.isDown,
        },
      },
      meta: { source: 'keyboard' },
    };
  }

  update(time, delta) {
    this.inputIntent = createInputIntent(this.readInputIntent(time, delta));
    const velocity = movementFromIntent(this.inputIntent.move, this.moveSpeed());
    this.player.body.setVelocity(velocity.x, velocity.y);
    this.facing = facingFromVelocity(velocity.x, velocity.y, this.facing);

    this.contextualActions = [];
    this.currentContextualAction = null;
    this.nearInteraction = null; // compatibility view for existing HUD subclasses
    this.entities.update(this, time, delta);

    const context = this.contextualActionContext(time, delta);
    this.currentContextualAction = selectContextualAction(this.contextualActions, context);
    if (this.currentContextualAction) {
      this.nearInteraction = {
        prompt: this.currentContextualAction.label,
        entity: this.currentContextualAction.source,
        action: this.currentContextualAction,
      };
      const activation = advanceActionActivation(
        this.currentContextualAction,
        this.contextualActionActivation,
        this.inputIntent,
        delta,
      );
      this.contextualActionActivation = activation.state;
      if (activation.triggered) {
        executeContextualAction(this.currentContextualAction, context);
      }
    } else {
      this.contextualActionActivation = null;
    }

    this.prompt.setText(
      this.messageUntil > time
        ? this.message
        : (this.nearInteraction?.prompt ?? this.statusText()),
    );
    this.lifecycle.emit(lifecycleEvent.tick, { scene: this, time, delta });
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

  wasInteractJustPressed() {
    return actionState(this.inputIntent, 'interact').pressed;
  }

  interact(entity) {
    if (entity.spec.message) this.showMessage(entity.spec.message);
    this.onInteract(entity);
  }

  showMessage(message, duration = 2500) {
    this.message = message;
    this.messageUntil = this.time.now + duration;
  }

  // Temporarily releases follow, pans to a location, then returns to the player.
  panCameraTo(x, y, duration = 450) {
    this.cameras.main.stopFollow();
    this.cameras.main.pan(x, y, duration);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.PAN_COMPLETE, () => {
      this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    });
  }

  enterArea(to, entry) {
    this.transitioning = true;
    this.onEnterArea(to, entry);
  }

  onInteract() {}
  onEnterArea() {}
}
