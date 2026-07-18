import { defineRecipe } from '@phaser-game-engines/core';
import { createTraversalTuningMechanic } from '../mechanics/traversal-tuning.js';

/** Tuned movement recipe for responsive precision platformers. */
export function createPrecisionPlatformerRecipe(options = {}) {
  return defineRecipe({
    id: options.id ?? 'platformer.precision',
    owns: ['player.traversal-tuning'],
    policies: {
      traversal: createTraversalTuningMechanic({
        maxSpeed: 210,
        acceleration: 1500,
        groundDrag: 1900,
        airDrag: 120,
        jumpVelocity: -430,
        coyoteMs: 100,
        jumpBufferMs: 120,
        ...options.traversal,
      }),
    },
  });
}
