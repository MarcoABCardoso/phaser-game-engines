import { defineRecipe } from '@phaser-game-engines/toolkit/core';

/** Movement and status presentation defaults for exploration-focused games. */
export function createExplorationRecipe(options = {}) {
  const mechanic = (scene) => {
    const previousMoveSpeed = scene.moveSpeed;
    const previousStatusText = scene.statusText;
    if (options.moveSpeed !== undefined) scene.moveSpeed = () => options.moveSpeed;
    if (options.statusText !== undefined) {
      scene.statusText = () => typeof options.statusText === 'function'
        ? options.statusText(scene)
        : options.statusText;
    }
    return () => {
      scene.moveSpeed = previousMoveSpeed;
      scene.statusText = previousStatusText;
    };
  };
  return defineRecipe({
    id: options.id ?? 'top-down.exploration',
    owns: ['player.movement-tuning', 'presentation.status'],
    policies: { movementAndStatus: mechanic },
  });
}
