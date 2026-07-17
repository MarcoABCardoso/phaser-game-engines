export { createInputIntent, actionState } from './input.js';
export {
  advanceActionActivation,
  selectContextualAction,
  executeContextualAction,
} from './actions.js';
export { createLifecycle, lifecycleEvent } from './lifecycle.js';
export { createCapabilities, getCapability, hasCapability } from './capabilities.js';
export { createMechanicHost } from './mechanics.js';
export { pointInRect, boxesOverlap, entitiesInRect } from './geometry.js';
export { createResourceScope, runCleanups } from './resources.js';
export {
  ContentValidationError,
  ENTITY_SCHEMA_VERSION,
  WORLD_SCHEMA_VERSION,
  validateEntitySpec,
  validateLevel,
  validatePortalSpec,
  validateRect,
} from './schema.js';
export { createSnapshotCodec } from './serialization.js';
export {
  createEntityRegistry,
  createTriggerZone,
  createWorldRuntime,
  EntityStore,
  WorldEntity,
} from './world.js';
