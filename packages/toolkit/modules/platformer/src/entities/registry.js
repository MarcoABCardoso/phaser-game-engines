// registry.js — the engine's built-in entity types: the generic platformer things a
// spec's `type` string can name. A game layers its own types on top by passing an
// extended registry to EntityManager (see game/scenes/GameScene.js, which adds the
// artifact). The engine itself knows nothing about any game-specific entity.
import Spawner from './Spawner.js';
import MovingPlatform from './MovingPlatform.js';
import Portal from './Portal.js';

export const BASE_ENTITY_TYPES = {
  spawner: Spawner,
  movingPlatform: MovingPlatform,
  portal: Portal,
};
