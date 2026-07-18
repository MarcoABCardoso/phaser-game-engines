import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
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
  '@phaser-game-engines/core',
  '@phaser-game-engines/platformer',
  '@phaser-game-engines/top-down',
  '@phaser-game-engines/turn-based-battle',
  '@phaser-game-engines/create-game',
  '@phaser-game-engines/content-tools',
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
const [core, platformer, topDown, battle, creator, contentTools, tiledTools, viteTools] = await Promise.all([
  import('@phaser-game-engines/core/headless'),
  import('@phaser-game-engines/platformer/headless'),
  import('@phaser-game-engines/top-down/headless'),
  import('@phaser-game-engines/turn-based-battle/headless'),
  import('@phaser-game-engines/create-game'),
  import('@phaser-game-engines/content-tools'),
  import('@phaser-game-engines/content-tools/tiled'),
  import('@phaser-game-engines/content-tools/vite'),
]);
if (typeof core.createWorldRuntime !== 'function') throw new Error('core headless export failed');
if (typeof platformer.createTraversalController !== 'function') throw new Error('platformer headless export failed');
if (typeof topDown.movementFromIntent !== 'function') throw new Error('top-down headless export failed');
if (typeof battle.Battle !== 'function') throw new Error('battle headless export failed');
if (typeof creator.createProject !== 'function') throw new Error('project generator export failed');
if (typeof contentTools.validateContent !== 'function') throw new Error('content tools export failed');
if (typeof tiledTools.convertTiledMap !== 'function') throw new Error('Tiled adapter export failed');
if (typeof viteTools.createContentValidationPlugin !== 'function') throw new Error('Vite content plugin export failed');
console.log('Packed headless exports load from a clean consumer project.');
`);

  writeFileSync(join(consumerDirectory, 'index.html'), '<script type="module" src="/main.js"></script>\n');
  writeFileSync(join(consumerDirectory, 'main.js'), `
import { PlatformerScene } from '@phaser-game-engines/platformer';
import { TopDownScene } from '@phaser-game-engines/top-down';
import { BattleScene } from '@phaser-game-engines/turn-based-battle';
import { convertTiledMap } from '@phaser-game-engines/content-tools/tiled';
console.log(PlatformerScene, TopDownScene, BattleScene, convertTiledMap);
`);
  writeFileSync(join(consumerDirectory, 'consumer.ts'), `
import { createWorldRuntime } from '@phaser-game-engines/core/headless';
import { createTraversalController } from '@phaser-game-engines/platformer/headless';
import { movementFromIntent } from '@phaser-game-engines/top-down/headless';
import { Battle, type BattleRules } from '@phaser-game-engines/turn-based-battle/headless';
import { createProject, type Genre } from '@phaser-game-engines/create-game';
import { validateContent, type ContentKind } from '@phaser-game-engines/content-tools';
import { convertTiledMap, type TiledMap } from '@phaser-game-engines/content-tools/tiled';
const rules: BattleRules<{}, { ids: string[] }, string> = {
  createInitialState: () => ({ ids: ['a'] }),
  getTurnOrder: state => state.ids,
  getAvailableCommands: (_state, actorId) => [{ id: 'wait', actorId }],
  resolveCommand: state => ({ state }),
  getOutcome: () => null,
};
const genre: Genre = 'platformer';
const kind: ContentKind = 'world';
void [createWorldRuntime(), createTraversalController(), movementFromIntent({}, 1), new Battle({}, { rules }), createProject, genre, validateContent, convertTiledMap, kind];
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
  const smoke = run(process.execPath, ['smoke.mjs'], consumerDirectory);
  process.stdout.write(smoke.stdout);
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
