// registry.js — the engine's built-in entity types: the generic platformer things a
// spec's `type` string can name. A game layers its own types on top by passing an
// extended registry to EntityManager (see game/scenes/GameScene.js, which adds the
// artifact). The engine itself knows nothing about any game-specific entity.
import Barricade from './Barricade.js';
import Boss from './Boss.js';
import Spawner from './Spawner.js';
import Sign from './Sign.js';
import MovingPlatform from './MovingPlatform.js';
import DialogTrigger from './DialogTrigger.js';
import Gate from './Gate.js';
import Portal from './Portal.js';

export const BASE_ENTITY_TYPES = {
  spawner: Spawner,
  movingPlatform: MovingPlatform,
  portal: Portal,
};

/** Opinionated entities retained for the legacy action-platformer recipe. */
export const ACTION_PLATFORMER_ENTITY_TYPES = {
  barricade: Barricade,
  boss: Boss,
  sign: Sign,
  dialogTrigger: DialogTrigger,
  gate: Gate,
};
