import { runCleanups } from '@phaser-game-engines/core';

/** Install game-agnostic player health, healing, and temporary invulnerability. */
export function createHealthMechanic(options = {}) {
  const max = options.max ?? 5;
  if (!Number.isFinite(max) || max <= 0) throw new TypeError('Health max must be positive.');

  return function installHealth(scene) {
    const controller = {
      max,
      current: Math.min(max, options.initial ?? max),
      invulnerableUntil: -Infinity,
      get depleted() { return this.current <= 0; },
      isInvulnerable(time = scene.time?.now ?? 0) { return time < this.invulnerableUntil; },
      damage(amount, context = {}) {
        const time = context.time ?? scene.time?.now ?? 0;
        if (this.depleted || this.isInvulnerable(time)) return false;
        if (!Number.isFinite(amount) || amount < 0) throw new TypeError('Damage must be non-negative.');
        const previous = this.current;
        this.current = Math.max(0, this.current - amount);
        if (context.invulnerableMs) this.invulnerableUntil = time + context.invulnerableMs;
        options.onChanged?.({ previous, current: this.current, amount: previous - this.current, kind: 'damage', context }, scene, this);
        if (this.depleted) options.onDepleted?.(context, scene, this);
        return this.current !== previous;
      },
      heal(amount, context = {}) {
        if (!Number.isFinite(amount) || amount < 0) throw new TypeError('Healing must be non-negative.');
        const previous = this.current;
        this.current = Math.min(this.max, this.current + amount);
        options.onChanged?.({ previous, current: this.current, amount: this.current - previous, kind: 'heal', context }, scene, this);
        return this.current !== previous;
      },
      reset(value = this.max) {
        const previous = this.current;
        this.current = Math.max(0, Math.min(this.max, value));
        this.invulnerableUntil = -Infinity;
        options.onChanged?.({ previous, current: this.current, amount: this.current - previous, kind: 'reset', context: {} }, scene, this);
      },
    };
    scene.platformerHealth = controller;
    const stopTick = scene.lifecycle.on('tick', ({ time }) => {
      options.onTick?.({ time, invulnerable: controller.isInvulnerable(time) }, scene, controller);
    });
    return () => {
      runCleanups([stopTick], 'Health mechanic cleanup failed.');
      if (scene.platformerHealth === controller) delete scene.platformerHealth;
      options.onRemove?.(controller, scene);
    };
  };
}
