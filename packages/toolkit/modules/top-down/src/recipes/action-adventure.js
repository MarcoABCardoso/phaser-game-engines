import {
  actionState,
  getCapability,
  hasCapability,
  lifecycleEvent,
  ContentValidationError,
  defineRecipe,
} from '@phaser-game-engines/toolkit/core';
import Enemy from '../entities/Enemy.js';
import Pickup from '../entities/Pickup.js';

export const ACTION_ADVENTURE_ENTITY_TYPES = Object.freeze({ enemy: Enemy, pickup: Pickup });

/** @typedef {{ maxHealth?: number, attackCooldownMs?: number, attackDamage?: number, invulnerableMs?: number, attackAction?: string, save?: { flags?: Record<string, boolean>, inventory?: Record<string, number> }, onAttack?: Function, onCollect?: Function, onPlayerDefeated?: Function, onEnemyDefeated?: Function, onRemove?: Function, statusText?: Function }} ActionAdventureOptions */

/** Opt-in health, melee, pickups, and chasing-enemy policy.
 * @param {ActionAdventureOptions} options
 */
function createActionAdventureMechanic(options = {}) {
  validateActionAdventureOptions(options);
  return function installActionAdventure(scene) {
    const maxHealth = options.maxHealth ?? 5;
    const save = options.save ?? { flags: {}, inventory: {} };
    save.flags ??= {};
    save.inventory ??= {};
    const controller = {
      health: maxHealth,
      save,
      lastAttackAt: -Infinity,
      invulnerableUntil: -Infinity,
      attack(time) {
        if (time - this.lastAttackAt < (options.attackCooldownMs ?? 250)) return null;
        this.lastAttackAt = time;
        const target = scene.entities.firstWithCapability(
          'targetable',
          (capability, entity) => hasCapability(entity, 'damageReceiver')
            && (typeof capability?.inRange !== 'function' || capability.inRange(scene)),
        );
        getCapability(target, 'damageReceiver')?.receive?.({
          scene, source: scene.player, amount: options.attackDamage ?? 1,
        });
        options.onAttack?.(target, scene, this);
        return target;
      },
      collect(entity) {
        if (entity.goneFlag) this.save.flags[entity.goneFlag] = true;
        const item = entity.spec.item ?? entity.id;
        if (item) this.save.inventory[item] = (this.save.inventory[item] ?? 0) + 1;
        options.onCollect?.(entity, scene, this);
      },
      damagePlayer(amount, source) {
        if (this.invulnerableUntil > scene.time.now) return false;
        this.invulnerableUntil = scene.time.now + (options.invulnerableMs ?? 500);
        this.health = Math.max(0, this.health - amount);
        if (source) {
          const dx = scene.player.x - source.x;
          const dy = scene.player.y - source.y;
          const distance = Math.hypot(dx, dy) || 1;
          scene.player.body.setVelocity((dx / distance) * 160, (dy / distance) * 160);
        }
        if (this.health === 0) options.onPlayerDefeated?.(scene, this);
        return true;
      },
      onEnemyDefeated(entity) { options.onEnemyDefeated?.(entity, scene, this); },
    };

    const previousStatusText = scene.statusText;
    scene.actionAdventure = controller;
    scene.statusText = () => options.statusText?.(controller, scene)
      ?? `HP ${controller.health}/${maxHealth}`;
    const stopTick = scene.lifecycle.on(lifecycleEvent.tick, ({ time }) => {
      if (actionState(scene.inputIntent, options.attackAction ?? 'primary').pressed) {
        controller.attack(time);
      }
    });
    return () => {
      stopTick();
      if (scene.actionAdventure === controller) delete scene.actionAdventure;
      scene.statusText = previousStatusText;
      options.onRemove?.(controller, scene);
    };
  };
}

/** Compose the action-adventure entities and mechanic as one explicit scene recipe. */
export function createActionAdventureRecipe(options = {}) {
  validateActionAdventureOptions(options);
  return defineRecipe({
    id: options.id ?? 'top-down.action-adventure',
    owns: ['player.health', 'player.primary-action', 'world.pickups'],
    entityTypes: ACTION_ADVENTURE_ENTITY_TYPES,
    policies: { actionAdventure: createActionAdventureMechanic(options) },
  });
}

/** Validate the serializable action-adventure options shared with its JSON Schema.
 * @param {ActionAdventureOptions} options
 */
export function validateActionAdventureOptions(options = {}, { path = 'actionAdventure' } = {}) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    throw new ContentValidationError(path, 'expected an object.');
  }
  for (const field of ['attackCooldownMs', 'attackDamage', 'invulnerableMs']) {
    if (options[field] !== undefined && (!Number.isFinite(options[field]) || options[field] < 0)) {
      throw new ContentValidationError(`${path}.${field}`, 'expected a non-negative finite number.');
    }
  }
  if (options.maxHealth !== undefined && (!Number.isFinite(options.maxHealth) || options.maxHealth <= 0)) {
    throw new ContentValidationError(`${path}.maxHealth`, 'expected a positive finite number.');
  }
  if (options.attackAction !== undefined && (typeof options.attackAction !== 'string' || !options.attackAction)) {
    throw new ContentValidationError(`${path}.attackAction`, 'expected a non-empty string.');
  }
  return options;
}
