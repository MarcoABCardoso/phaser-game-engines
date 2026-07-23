export { createInputIntent, actionState } from './input.js';
export { defineLevel, defineEntity, definePortal } from './content.js';
export { ASSET_MANIFEST_VERSION, assetTypes, validateAssetManifest, preloadAssetManifest, installAnimationDefinitions, createAssetLoadError, } from './assets.js';
export { createKeyboardInputAdapter, createGamepadInputAdapter, createTouchInputAdapter, } from './input-adapters.js';
export { advanceActionActivation, selectContextualAction, executeContextualAction, } from './actions.js';
export { createLifecycle, lifecycleEvent } from './lifecycle.js';
export { createCapabilities, getCapability, hasCapability } from './capabilities.js';
export { createMechanicHost } from './mechanics.js';
export { createPresentationHost } from './presentation.js';
export { composeRecipes, defineRecipe, replaceRecipePolicy } from './recipes.js';
export { pointInRect, boxesOverlap, entitiesInRect } from './geometry.js';
export { createResourceScope, runCleanups } from './resources.js';
export { ContentValidationError, ENTITY_SCHEMA_VERSION, WORLD_SCHEMA_VERSION, validateEntitySpec, validateLevel, validatePortalSpec, validateRect, } from './schema.js';
export { createSnapshotCodec } from './serialization.js';
export { createManualClock, createSeededRng, systemClock } from './determinism.js';
export { createSessionRecorder, replaySession } from './recording.js';
export { createReplayViewer } from './replay.js';
export { captureSessionSnapshot, restoreSessionSnapshot, createBugReportBundle } from './session.js';
export { createMemoryStorage, createLocalStorageAdapter, createSaveStore } from './storage.js';
export { createSimulationHarness, measureBudget } from './testing.js';
export { createDebugEventLog, inspectCapabilities, inspectContextualActions, inspectController, createDebugOverlayMechanic, } from './debug.js';
export { createEntityRegistry, createTriggerZone, createWorldRuntime, EntityStore, WorldEntity, } from './world.js';
export type PresentationDescriptor = import('./presentation.js').PresentationDescriptor;
export type PresentationFactory = import('./presentation.js').PresentationFactory;
export type PresentationDefinitions = import('./presentation.js').PresentationDefinitions;
export type PresentationHandle = import('./presentation.js').PresentationHandle;
export type PresentationHost = import('./presentation.js').PresentationHost;
/** @typedef {import('./presentation.js').PresentationDescriptor} PresentationDescriptor */
/** @typedef {import('./presentation.js').PresentationFactory} PresentationFactory */
/** @typedef {import('./presentation.js').PresentationDefinitions} PresentationDefinitions */
/** @typedef {import('./presentation.js').PresentationHandle} PresentationHandle */
/** @typedef {import('./presentation.js').PresentationHost} PresentationHost */
