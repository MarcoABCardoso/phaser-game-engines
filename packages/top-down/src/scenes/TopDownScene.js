import Phaser from 'phaser';
import {
  actionState,
  advanceActionActivation,
  createInputIntent,
  executeContextualAction,
  selectContextualAction,
} from '@phaser-game-engines/core';
import EntityManager from '../entities/EntityManager.js';
import { BASE_ENTITY_TYPES } from '../entities/registry.js';
import { facingFromVelocity, movementFromIntent } from '../systems/movement.js';

/** Extend this scene and return a level with world, spawn, walls, and entitySpecs. */
export default class TopDownScene extends Phaser.Scene {
  constructor(config = {}) {
    super(config);
    this.entityTypes = config.entityTypes;
  }

  getLevel() { throw new Error('TopDownScene subclasses must implement getLevel()'); }
  moveSpeed() { return 210; }
  playerMaxHealth() { return 5; }
  attackDamage() { return 1; }
  attackCooldownMs() { return 250; }
  getSave() { return { flags: {}, inventory: {} }; }

  create() {
    this.level = this.getLevel();
    this.save = this.getSave();
    this.transitioning = false;
    this.health = this.playerMaxHealth();
    this.lastAttackAt = -Infinity;

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
    this.entities = new EntityManager({
      ...BASE_ENTITY_TYPES,
      ...(this.level.entityTypes ?? {}),
      ...(this.entityTypes ?? {}),
    });
    this.entities.build(this, this.level.entitySpecs);
    this.prompt = this.add.text(12, 12, '', {
      fontFamily: 'sans-serif',
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#00000099',
      padding: { x: 6, y: 4 },
    }).setScrollFactor(0).setDepth(100);
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
        : (this.nearInteraction?.prompt ?? `HP ${this.health}/${this.playerMaxHealth()}`),
    );
    if (actionState(this.inputIntent, 'primary').pressed) this.attack(time);
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

  attack(time) {
    if (time - this.lastAttackAt < this.attackCooldownMs()) return;
    this.lastAttackAt = time;
    const target = this.entities.attackableInReach(this);
    if (target) target.onHit(this, this.attackDamage());
    this.onAttack(target);
  }

  collect(entity) {
    if (entity.goneFlag) this.save.flags[entity.goneFlag] = true;
    const item = entity.spec.item ?? entity.id;
    if (item) this.save.inventory[item] = (this.save.inventory[item] ?? 0) + 1;
    this.onCollect(entity);
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

  damagePlayer(amount, source) {
    if (this.invulnerableUntil > this.time.now) return;
    this.invulnerableUntil = this.time.now + 500;
    this.health = Math.max(0, this.health - amount);
    if (source) {
      const dx = this.player.x - source.x;
      const dy = this.player.y - source.y;
      const distance = Math.hypot(dx, dy) || 1;
      this.player.body.setVelocity((dx / distance) * 160, (dy / distance) * 160);
    }
    if (!this.health) this.onPlayerDefeated();
  }

  enterArea(to, entry) {
    this.transitioning = true;
    this.onEnterArea(to, entry);
  }

  onAttack() {}
  onCollect() {}
  onInteract() {}
  onEnemyDefeated() {}
  onPlayerDefeated() {}
  onEnterArea() {}
}
