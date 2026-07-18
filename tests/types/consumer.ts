import {
  captureSessionSnapshot,
  createInputIntent,
  createMemoryStorage,
  createReplayViewer,
  createSaveStore,
  createWorldRuntime,
  replaceRecipePolicy,
} from '@phaser-game-engines/core/headless';
import { createManualClock } from '@phaser-game-engines/core/determinism.js';
import { validateAssetManifest, type AssetManifest } from '@phaser-game-engines/core/assets.js';
import {
  PlatformerScene,
  createHealthMechanic,
  createPrecisionPlatformerRecipe,
} from '@phaser-game-engines/platformer';
import { createTraversalController } from '@phaser-game-engines/platformer/headless';
import type { PlatformerLevel } from '@phaser-game-engines/platformer/systems/content.js';
import { TopDownScene, createExplorationRecipe } from '@phaser-game-engines/top-down';
import { movementFromIntent } from '@phaser-game-engines/top-down/headless';
import { BattleScene, createBattlePresentationRecipe } from '@phaser-game-engines/turn-based-battle';
import {
  Battle,
  type BattleRules,
  type BattleCommand,
} from '@phaser-game-engines/turn-based-battle/headless';
import { createProject, type Genre } from '@phaser-game-engines/create-game';
import { validateContent, type ContentKind } from '@phaser-game-engines/content-tools';
import { convertTiledMap, type TiledMap } from '@phaser-game-engines/content-tools/tiled';

const intent = createInputIntent({ move: { x: 1, y: 0 }, actions: { jump: true } });
const velocity: { x: number; y: number } = movementFromIntent(intent.move, 200);
const clock: number = createManualClock().now();
const traversal = createTraversalController();
const runtime = createWorldRuntime();
const precision = replaceRecipePolicy(
  createPrecisionPlatformerRecipe(),
  'traversal',
  createHealthMechanic(),
);
const snapshot = captureSessionSnapshot({ clock: createManualClock() });
const saves = createSaveStore({ storage: createMemoryStorage() });
const replay = createReplayViewer({ version: 1, entries: [] });

type GameState = { participants: string[]; done: boolean };
const rules: BattleRules<{ participants: string[] }, GameState, { winner: string }> = {
  createInitialState: (spec) => ({ participants: spec.participants, done: false }),
  getTurnOrder: (state) => state.participants,
  getAvailableCommands: (_state, actorId) => [{ id: 'wait', actorId }],
  resolveCommand: (state, _command: BattleCommand) => ({ state: { ...state, done: true } }),
  getOutcome: (state) => state.done ? { winner: state.participants[0] } : null,
};
const battle = new Battle({ participants: ['player'] }, { rules });

const genre: Genre = 'platformer';
const kind: ContentKind = 'top-down';
const assets: AssetManifest = { assets: [{ key: 'hero', type: 'image', url: 'hero.png' }] };
const level: PlatformerLevel = { world: { width: 10, height: 10 }, spawn: { x: 1, y: 1 } };
void [velocity, clock, traversal, runtime, precision, snapshot, saves, replay, battle, genre, kind, assets, level, validateAssetManifest, validateContent, convertTiledMap, createProject, createExplorationRecipe, createBattlePresentationRecipe, PlatformerScene, TopDownScene, BattleScene];
void (null as TiledMap | null);
