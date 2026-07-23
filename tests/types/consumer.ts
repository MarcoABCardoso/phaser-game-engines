import {
  captureSessionSnapshot,
  createInputIntent,
  createMemoryStorage,
  createReplayViewer,
  createPresentationHost,
  createSaveStore,
  createWorldRuntime,
  replaceRecipePolicy,
  type PresentationDefinitions,
} from '@phaser-game-engines/toolkit/core/headless';
import { createManualClock } from '@phaser-game-engines/toolkit/core/determinism.js';
import { validateAssetManifest, type AssetManifest } from '@phaser-game-engines/toolkit/core/assets.js';
import {
  PlatformerScene,
  createHealthMechanic,
  createDialoguePresentationRecipe,
  createPrecisionPlatformerRecipe,
} from '@phaser-game-engines/toolkit/platformer';
import { createTraversalController } from '@phaser-game-engines/toolkit/platformer/headless';
import type { PlatformerLevel } from '@phaser-game-engines/toolkit/platformer/systems/content.js';
import { TopDownScene, createExplorationRecipe } from '@phaser-game-engines/toolkit/top-down';
import { movementFromIntent } from '@phaser-game-engines/toolkit/top-down/headless';
import {
  BattleScene,
  createBattlePresentationRecipe,
  createBattleResultPresentationRecipe,
} from '@phaser-game-engines/toolkit/battle';
import {
  Battle,
  type BattleRules,
  type BattleCommand,
} from '@phaser-game-engines/toolkit/battle/headless';
import { InventoryScene, createInventoryDragDropRecipe } from '@phaser-game-engines/toolkit/inventory';
import { Inventory, type InventoryRules } from '@phaser-game-engines/toolkit/inventory/headless';
import { createProject, type Genre } from '@phaser-game-engines/create-game';
import { validateContent, type ContentKind } from '@phaser-game-engines/toolkit/content';
import { convertTiledMap, type TiledMap } from '@phaser-game-engines/toolkit/content/tiled';

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
const presentationDefinitions: PresentationDefinitions = {
  presenters: { dialog: ({ model }) => ({ root: null, update: () => void model }) },
};
const presentation = createPresentationHost({}, presentationDefinitions);
const dialogRecipe = createDialoguePresentationRecipe();
const resultRecipe = createBattleResultPresentationRecipe<{ winner: string }, { title: string }>({
  getModel: (outcome) => ({ title: outcome.winner }),
});

type GameState = { participants: string[]; done: boolean };
const rules: BattleRules<{ participants: string[] }, GameState, { winner: string }> = {
  createInitialState: (spec) => ({ participants: spec.participants, done: false }),
  getTurnOrder: (state) => state.participants,
  getAvailableCommands: (_state, actorId) => [{ id: 'wait', actorId }],
  resolveCommand: (state, _command: BattleCommand) => ({ state: { ...state, done: true } }),
  getOutcome: (state) => state.done ? { winner: state.participants[0] } : null,
};
const battle = new Battle({ participants: ['player'] }, { rules });
type Item = { id: string; tags: string[] };
const inventoryRules: InventoryRules<Item> = { canEquip: (item, slot) => item.tags.includes(`equip:${slot}`) };
const inventory = new Inventory<Item>({ itemSlots: 8, equipmentSlots: ['hand'] }, { rules: inventoryRules });

const genre: Genre = 'platformer';
const kind: ContentKind = 'top-down';
const assets: AssetManifest = { assets: [{ key: 'hero', type: 'image', url: 'hero.png' }] };
const level: PlatformerLevel = { world: { width: 10, height: 10 }, spawn: { x: 1, y: 1 } };
void [velocity, clock, traversal, runtime, precision, snapshot, saves, replay, presentation, dialogRecipe, resultRecipe, battle, inventory, genre, kind, assets, level, validateAssetManifest, validateContent, convertTiledMap, createProject, createExplorationRecipe, createBattlePresentationRecipe, createInventoryDragDropRecipe, PlatformerScene, TopDownScene, BattleScene, InventoryScene];
void (null as TiledMap | null);
