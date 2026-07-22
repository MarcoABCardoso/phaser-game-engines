import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('npm_execpath is required to verify package tarballs.');
const temporaryRoot = mkdtempSync(join(tmpdir(), 'phaser-game-engines-'));
const packDirectory = join(temporaryRoot, 'packages');
const consumerDirectory = join(temporaryRoot, 'consumer');
const packageNames = [
  '@phaser-game-engines/toolkit',
  '@phaser-game-engines/create-game',
];

try {
  mkdirSync(packDirectory);
  mkdirSync(consumerDirectory);
  const dependencies = {
    phaser: pathToFileURL(join(root, 'node_modules', 'phaser')).href,
  };

  for (const packageName of packageNames) {
    const result = run(process.execPath, [npmCli,
      'pack', '--json', '--pack-destination', packDirectory, '--workspace', packageName,
    ], root);
    const [{ filename }] = JSON.parse(result.stdout);
    dependencies[packageName] = pathToFileURL(join(packDirectory, filename)).href;
  }

  writeFileSync(join(consumerDirectory, 'package.json'), JSON.stringify({
    name: 'phaser-game-engines-consumer-smoke',
    private: true,
    type: 'module',
    dependencies,
  }, null, 2));

  writeFileSync(join(consumerDirectory, 'smoke.mjs'), `
const [core, platformer, topDown, battle, inventory, creator, contentTools, tiledTools, viteTools] = await Promise.all([
  import('@phaser-game-engines/toolkit/core/headless'),
  import('@phaser-game-engines/toolkit/platformer/headless'),
  import('@phaser-game-engines/toolkit/top-down/headless'),
  import('@phaser-game-engines/toolkit/battle/headless'),
  import('@phaser-game-engines/toolkit/inventory/headless'),
  import('@phaser-game-engines/create-game'),
  import('@phaser-game-engines/toolkit/content'),
  import('@phaser-game-engines/toolkit/content/tiled'),
  import('@phaser-game-engines/toolkit/content/vite'),
]);
if (typeof core.createWorldRuntime !== 'function') throw new Error('core headless export failed');
if (typeof platformer.createTraversalController !== 'function') throw new Error('platformer headless export failed');
if (typeof topDown.movementFromIntent !== 'function') throw new Error('top-down headless export failed');
if (typeof battle.Battle !== 'function') throw new Error('battle headless export failed');
if (typeof inventory.Inventory !== 'function') throw new Error('inventory headless export failed');
if (typeof creator.createProject !== 'function') throw new Error('project generator export failed');
if (typeof contentTools.validateContent !== 'function') throw new Error('content tools export failed');
if (typeof tiledTools.convertTiledMap !== 'function') throw new Error('Tiled adapter export failed');
if (typeof viteTools.createContentValidationPlugin !== 'function') throw new Error('Vite content plugin export failed');
console.log('Packed headless exports load from a clean consumer project.');
`);

  writeFileSync(join(consumerDirectory, 'index.html'), '<script type="module" src="/main.js"></script>\n');
  writeFileSync(join(consumerDirectory, 'main.js'), `
import { PlatformerScene } from '@phaser-game-engines/toolkit/platformer';
import { TopDownScene } from '@phaser-game-engines/toolkit/top-down';
import { BattleScene } from '@phaser-game-engines/toolkit/battle';
import { InventoryScene } from '@phaser-game-engines/toolkit/inventory';
import { convertTiledMap } from '@phaser-game-engines/toolkit/content/tiled';
console.log(PlatformerScene, TopDownScene, BattleScene, InventoryScene, convertTiledMap);
`);
  writeFileSync(join(consumerDirectory, 'consumer.ts'), `
import { createWorldRuntime } from '@phaser-game-engines/toolkit/core/headless';
import { createTraversalController } from '@phaser-game-engines/toolkit/platformer/headless';
import { movementFromIntent } from '@phaser-game-engines/toolkit/top-down/headless';
import { Battle, type BattleRules } from '@phaser-game-engines/toolkit/battle/headless';
import { Inventory } from '@phaser-game-engines/toolkit/inventory/headless';
import { createProject, type Genre } from '@phaser-game-engines/create-game';
import { validateContent, type ContentKind } from '@phaser-game-engines/toolkit/content';
import { convertTiledMap, type TiledMap } from '@phaser-game-engines/toolkit/content/tiled';
const rules: BattleRules<{}, { ids: string[] }, string> = {
  createInitialState: () => ({ ids: ['a'] }),
  getTurnOrder: state => state.ids,
  getAvailableCommands: (_state, actorId) => [{ id: 'wait', actorId }],
  resolveCommand: state => ({ state }),
  getOutcome: () => null,
};
const genre: Genre = 'platformer';
const kind: ContentKind = 'world';
void [createWorldRuntime(), createTraversalController(), movementFromIntent({}, 1), new Battle({}, { rules }), new Inventory({ itemSlots: 4 }), createProject, genre, validateContent, convertTiledMap, kind];
void (null as TiledMap | null);
`);
  writeFileSync(join(consumerDirectory, 'tsconfig.json'), JSON.stringify({
    compilerOptions: {
      module: 'NodeNext', moduleResolution: 'NodeNext', noEmit: true,
      skipLibCheck: true, strict: true, target: 'ES2022',
    },
    include: ['consumer.ts'],
  }, null, 2));

  run(process.execPath, [
    npmCli, 'install', '--ignore-scripts', '--no-audit', '--no-fund', '--offline',
  ], consumerDirectory);
  const binSuffix = process.platform === 'win32' ? '.cmd' : '';
  for (const command of ['pge-content', 'create-phaser-game-engines']) {
    const installedBin = join(consumerDirectory, 'node_modules', '.bin', `${command}${binSuffix}`);
    if (!existsSync(installedBin)) {
      throw new Error(`Packed package did not install the ${command} executable.`);
    }
  }
  const smoke = run(process.execPath, ['smoke.mjs'], consumerDirectory);
  process.stdout.write(smoke.stdout);
  const contentHelp = run(process.execPath, [
    join(
      consumerDirectory,
      'node_modules',
      '@phaser-game-engines',
      'toolkit',
      'modules',
      'content-tools',
      'bin',
      'pge-content.js',
    ),
    '--help',
  ], consumerDirectory);
  if (!contentHelp.stdout.includes('pge-content validate')) {
    throw new Error('Packed content CLI help failed.');
  }
  const generatorVersion = run(process.execPath, [
    join(
      consumerDirectory,
      'node_modules',
      '@phaser-game-engines',
      'create-game',
      'bin',
      'create-game.js',
    ),
    '--version',
  ], consumerDirectory);
  if (!generatorVersion.stdout.trim()) throw new Error('Packed generator version failed.');
  run(process.execPath, [join(root, 'node_modules', 'typescript', 'bin', 'tsc'), '-p', 'tsconfig.json'], consumerDirectory);
  run(process.execPath, [join(root, 'node_modules', 'vite', 'bin', 'vite.js'), 'build'], consumerDirectory);
  console.log('Packed browser roots type-check and build in a clean Vite project.');
} finally {
  const resolvedTemporaryRoot = dirname(join(temporaryRoot, 'sentinel'));
  if (!resolvedTemporaryRoot.startsWith(dirname(temporaryRoot))) {
    throw new Error('Refusing to clean an unexpected package verification path.');
  }
  rmSync(resolvedTemporaryRoot, { recursive: true, force: true });
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, npm_config_cache: join(temporaryRoot, 'npm-cache') },
  });
  if (result.status !== 0) {
    throw new Error([
      `${command} ${args.join(' ')} failed with status ${result.status}.`,
      result.stdout,
      result.stderr,
    ].filter(Boolean).join('\n'));
  }
  return result;
}
