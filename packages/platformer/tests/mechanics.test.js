import { describe, expect, it, vi } from 'vitest';
import { createLifecycle } from '@phaser-game-engines/core';
import { createLandingConsequenceMechanic } from '../src/mechanics/landing-consequences.js';

describe('platformer mechanics', () => {
  it('maps landing facts and cleanly removes its listener', () => {
    const apply = vi.fn();
    const scene = { lifecycle: createLifecycle() };
    const mechanic = createLandingConsequenceMechanic({
      resolve: ({ drop }) => drop >= 100 ? { damage: 1 } : null,
      apply,
    });
    const remove = mechanic(scene);

    scene.lifecycle.emit('landing', { scene, drop: 120, impactVelocity: 500 });
    expect(apply).toHaveBeenCalledWith(
      { damage: 1 },
      { scene, fact: { scene, drop: 120, impactVelocity: 500 } },
    );
    remove();
    scene.lifecycle.emit('landing', { scene, drop: 200, impactVelocity: 700 });
    expect(apply).toHaveBeenCalledTimes(1);
  });
});
