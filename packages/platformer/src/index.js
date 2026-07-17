// Public API for the Phaser platformer engine. Subpath exports remain available
// for consumers that need a specific entity or pure system.
export { default as PlatformerScene } from './scenes/PlatformerScene.js';
export { default as Entity } from './entities/Entity.js';
export { default as EntityManager } from './entities/EntityManager.js';
export { BASE_ENTITY_TYPES } from './entities/registry.js';
export {
  createTraversalController,
  createLocomotionController,
  createDashController,
  createJumpController,
  createWallTraversalController,
  createLedgeTraversalController,
  createLandingController,
  createAreaTransitionController,
} from './controllers/index.js';
