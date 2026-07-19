import { actionState, getCapability, hasCapability } from '@phaser-game-engines/toolkit/core';

/** Resolve a primary action against the first in-range targetable damage receiver. */
export function createMeleeAttackMechanic(options = {}) {
  return function installMeleeAttack(scene) {
    const controller = {
      reach: options.reach ?? 56,
      lastAttackAt: -Infinity,
      attack(time = scene.time?.now ?? 0) {
        if (time - this.lastAttackAt < (options.cooldownMs ?? 260)) return null;
        const target = scene.entities?.firstWithCapability(
          'targetable',
          (capability, entity) => hasCapability(entity, 'damageReceiver')
            && (typeof capability?.inRange !== 'function' || capability.inRange(scene, this)),
        );
        if (!target) return null;
        this.lastAttackAt = time;
        const amount = typeof options.damage === 'function'
          ? options.damage({ scene, target, controller: this })
          : (options.damage ?? 1);
        getCapability(target, 'damageReceiver')?.receive?.({ scene, source: scene.player, amount });
        options.onAttack?.({ target, amount, time }, scene, this);
        return target;
      },
    };
    scene.platformerAttack = controller;
    const stop = scene.lifecycle.on('afterTraversal', ({ time }) => {
      if (!scene.hanging && actionState(scene.inputIntent, options.action ?? 'primary').pressed) {
        controller.attack(time);
      }
    });
    return () => {
      stop();
      if (scene.platformerAttack === controller) delete scene.platformerAttack;
      options.onRemove?.(controller, scene);
    };
  };
}
