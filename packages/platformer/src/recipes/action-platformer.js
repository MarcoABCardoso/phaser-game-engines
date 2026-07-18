import { defineRecipe } from '@phaser-game-engines/core';
import Barricade from '../entities/Barricade.js';
import DialogTrigger from '../entities/DialogTrigger.js';
import Gate from '../entities/Gate.js';
import Sign from '../entities/Sign.js';
import { createCheckpointMechanic } from '../mechanics/checkpoints.js';
import { createDialogueMechanic } from '../mechanics/dialogue.js';
import { createFailureMechanic } from '../mechanics/failure.js';
import { createHealthMechanic } from '../mechanics/health.js';
import { createMeleeAttackMechanic } from '../mechanics/melee-attack.js';

export const ACTION_PLATFORMER_ENTITY_TYPES = Object.freeze({
  barricade: Barricade,
  sign: Sign,
  dialogTrigger: DialogTrigger,
  gate: Gate,
});

/** A composed starting point for games that need health, melee, dialogue, and checkpoints. */
export function createActionPlatformerRecipe(options = {}) {
  const healthOptions = { ...options.health };
  const onDepleted = healthOptions.onDepleted;
  healthOptions.onDepleted = (context, scene, health) => {
    onDepleted?.(context, scene, health);
    if (!onDepleted) scene.platformerFailure?.fail(options.depletedReason ?? 'Health depleted.', { kind: 'health' });
  };
  return defineRecipe({
    id: options.id ?? 'platformer.action',
    owns: [
      'player.health',
      'player.primary-action',
      'world.checkpoints',
      'presentation.dialogue',
      'session.failure',
    ],
    entityTypes: ACTION_PLATFORMER_ENTITY_TYPES,
    policies: {
      failure: createFailureMechanic(options.failure),
      health: createHealthMechanic(healthOptions),
      attack: createMeleeAttackMechanic(options.attack),
      checkpoints: createCheckpointMechanic(options.checkpoints),
      dialogue: createDialogueMechanic(options.dialogue),
    },
  });
}
