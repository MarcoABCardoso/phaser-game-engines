import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, join, relative, resolve } from 'node:path';

export const genres = Object.freeze(['platformer', 'top-down', 'battle']);
export const languages = Object.freeze(['js', 'ts']);
export const inputAdapters = Object.freeze(['keyboard', 'gamepad', 'touch']);
export const recipes = Object.freeze({
  platformer: ['minimal'],
  'top-down': ['minimal', 'action-adventure'],
  battle: ['minimal'],
});

export const usage = `Usage:
  create-phaser-game-engines <directory> [options]

Options:
  --genre platformer|top-down|battle   Starter genre (default: platformer)
  --language js|ts                     Source language (default: js)
  --recipe <name>                      Optional composition (default: minimal)
  --input keyboard|gamepad|touch       Input adapter (default: keyboard)
  --package-source <repository>        Use packages from a local workspace
  --help                               Show this help`;

export function createProject({
  targetDirectory,
  genre = 'platformer',
  language = 'js',
  recipe = 'minimal',
  input = 'keyboard',
  packageSource,
  packageVersion = '0.1.0',
} = {}) {
  if (!targetDirectory) throw new TypeError('targetDirectory is required.');
  if (!genres.includes(genre)) throw new TypeError(`Unsupported genre: ${genre}.`);
  if (!languages.includes(language)) throw new TypeError(`Unsupported language: ${language}.`);
  if (!recipes[genre].includes(recipe)) throw new TypeError(`Recipe ${recipe} is not available for ${genre}.`);
  if (!inputAdapters.includes(input)) throw new TypeError(`Unsupported input adapter: ${input}.`);
  if (genre === 'battle' && input !== 'keyboard') {
    throw new TypeError('The minimal battle starter currently supports keyboard menu input only.');
  }

  const target = resolve(targetDirectory);
  if (existsSync(target) && readdirSync(target).length > 0) {
    throw new Error(`Target directory is not empty: ${target}`);
  }
  mkdirSync(join(target, 'src'), { recursive: true });
  const extension = language;
  const projectName = packageName(basename(target));
  const files = starterFiles({ target, projectName, genre, language, extension, recipe, input, packageSource, packageVersion });
  for (const [name, contents] of Object.entries(files)) {
    const path = join(target, name);
    mkdirSync(resolve(path, '..'), { recursive: true });
    writeFileSync(path, contents.endsWith('\n') ? contents : `${contents}\n`);
  }
  return Object.freeze({ targetDirectory: target, genre, language, recipe, input, files: Object.keys(files) });
}

function packageName(value) {
  const normalized = value.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
  return normalized || 'phaser-game';
}

function dependency(packageSource, target, directory, version) {
  if (!packageSource) return `^${version}`;
  const path = relative(target, join(packageSource, 'packages', directory)).replaceAll('\\', '/');
  return `file:${path || '.'}`;
}

function starterFiles(options) {
  const { target, projectName, genre, language, extension, recipe, input, packageSource, packageVersion } = options;
  const engineDirectory = genre === 'battle' ? 'turn-based-battle' : genre;
  const engineName = `@phaser-game-engines/${engineDirectory}`;
  const dependencies = {
    [engineName]: dependency(packageSource, target, engineDirectory, packageVersion),
    phaser: '^3.90.0',
  };
  if (input !== 'keyboard') {
    dependencies['@phaser-game-engines/core'] = dependency(packageSource, target, 'core', packageVersion);
  }
  const devDependencies = { vite: '^8.1.5', vitest: '^4.1.10' };
  if (language === 'ts') devDependencies.typescript = '^7.0.2';

  const common = {
    'package.json': JSON.stringify({
      name: projectName,
      private: true,
      version: '0.0.0',
      type: 'module',
      scripts: { dev: 'vite', build: 'vite build', test: 'vitest run', ...(language === 'ts' ? { typecheck: 'tsc --noEmit' } : {}) },
      dependencies,
      devDependencies,
    }, null, 2),
    'index.html': indexHtml(genre, extension),
    '.gitignore': 'node_modules/\ndist/',
    'README.md': starterReadme({ genre, language, recipe, input }),
  };
  if (language === 'ts') common['tsconfig.json'] = JSON.stringify({ compilerOptions: {
    target: 'ES2022', useDefineForClassFields: true, module: 'ESNext', moduleResolution: 'Bundler',
    strict: true, noEmit: true, skipLibCheck: true,
  }, include: ['src/**/*.ts'] }, null, 2);
  return { ...common, ...genreFiles(genre, extension, recipe, input) };
}

function indexHtml(genre, extension) {
  return `<!doctype html>
<html lang="en">
  <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${genre} starter</title></head>
  <body><main><h1>${genre} starter</h1><p id="controls"></p><div id="game"></div></main><script type="module" src="/src/main.${extension}"></script></body>
</html>`;
}

function starterReadme({ genre, language, recipe, input }) {
  return `# ${genre} starter

Generated as a ${language.toUpperCase()} ${genre} project using the ${recipe} recipe and ${input} input.

Run \`npm install\`, then \`npm run dev\`. Run the headless logic test with \`npm test\`.
`;
}

function genreFiles(genre, extension, recipe, input) {
  if (genre === 'platformer') return platformerFiles(extension, input);
  if (genre === 'top-down') return topDownFiles(extension, recipe, input);
  return battleFiles(extension);
}

function platformerFiles(ext, input) {
  const adapter = realTimeInput(input, 'jump');
  return {
    [`src/main.${ext}`]: `import Phaser from 'phaser';
import { PlatformerScene } from '@phaser-game-engines/platformer';
${adapter.imports}${adapter.declaration}class GameScene extends PlatformerScene {
${adapter.method}  getLevel() { return { world: { width: 960, height: 540 }, spawn: { x: 80, y: 420 }, floorSegments: [{ x: 0, y: 500, w: 960, h: 40 }], platforms: [], entitySpecs: [] }; }
}
${adapter.setup}const controls = document.querySelector('#controls');
if (controls) controls.textContent = 'Move: arrows/A-D. Jump: Space/Up.';
new Phaser.Game({ type: Phaser.AUTO, parent: 'game', width: 960, height: 540, backgroundColor: '#12151d', physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 1000 } } }, scene: [GameScene] });`,
    [`src/game.test.${ext}`]: `import { expect, test } from 'vitest';
import { createTraversalController } from '@phaser-game-engines/platformer/headless';
test('traversal starts from deterministic state', () => expect(createTraversalController().snapshot().facingDir).toBe(1));`,
  };
}

function topDownFiles(ext, recipe, input) {
  const adapter = realTimeInput(input, 'interact');
  const recipeImports = recipe === 'action-adventure' ? ', createActionAdventureRecipe' : '';
  const constructor = recipe === 'action-adventure' ? `  constructor() { super({ recipes: [createActionAdventureRecipe()] }); }\n` : '';
  return {
    [`src/main.${ext}`]: `import Phaser from 'phaser';
import { TopDownScene${recipeImports} } from '@phaser-game-engines/top-down';
${adapter.imports}${adapter.declaration}class GameScene extends TopDownScene {
${constructor}${adapter.method}  getLevel() { return { world: { width: 960, height: 540 }, spawn: { x: 80, y: 80 }, walls: [], entitySpecs: [] }; }
}
${adapter.setup}const controls = document.querySelector('#controls');
if (controls) controls.textContent = 'Move: arrows/WASD. Interact: E.';
new Phaser.Game({ type: Phaser.AUTO, parent: 'game', width: 960, height: 540, backgroundColor: '#18212d', physics: { default: 'arcade' }, scene: [GameScene] });`,
    [`src/game.test.${ext}`]: `import { expect, test } from 'vitest';
import { movementFromIntent } from '@phaser-game-engines/top-down/headless';
test('movement is deterministic', () => expect(movementFromIntent({ x: 1, y: 0 }, 200)).toEqual({ x: 200, y: 0 }));`,
  };
}

function realTimeInput(input, action) {
  if (input === 'keyboard') return { imports: '', declaration: '', method: '', setup: '' };
  if (input === 'gamepad') {
    return {
      imports: `import { createGamepadInputAdapter } from '@phaser-game-engines/core';\n`,
      declaration: `const inputAdapter = createGamepadInputAdapter();\n`,
      method: `  readInputIntent() { return inputAdapter.read(); }\n`,
      setup: '',
    };
  }
  return {
    imports: `import { createTouchInputAdapter } from '@phaser-game-engines/core';\n`,
    declaration: `const inputAdapter = createTouchInputAdapter({ actions: ['${action}'] });\n`,
    method: `  readInputIntent() { return inputAdapter.read(); }\n`,
    setup: touchSetup(action),
  };
}

function battleFiles(ext) {
  const typedImport = ext === 'ts'
    ? `import type { BattleRules } from '@phaser-game-engines/turn-based-battle/headless';\n`
    : '';
  const typedDeclaration = ext === 'ts'
    ? ': BattleRules<{}, { turns: number }, { kind: string }>'
    : '';
  const stateParameter = ext === 'ts' ? 'state: { turns: number }' : 'state';
  const actorParameters = ext === 'ts'
    ? '_state: unknown, actorId: string | number'
    : '_state, actorId';
  const sceneType = ext === 'ts'
    ? '<{}, { turns: number }, { kind: string }>'
    : '';
  return {
    [`src/rules.${ext}`]: `${typedImport}export const rules${typedDeclaration} = {
  createInitialState: () => ({ turns: 0 }), getTurnOrder: () => ['player'],
  getAvailableCommands: (${actorParameters}) => [{ id: 'wait', actorId }],
  resolveCommand: (${stateParameter}) => ({ state: { turns: state.turns + 1 } }),
  getOutcome: (${stateParameter}) => state.turns >= 1 ? { kind: 'complete' } : null,
};`,
    [`src/main.${ext}`]: `import Phaser from 'phaser';
import { BattleScene, createBattlePresentationRecipe } from '@phaser-game-engines/turn-based-battle';
import { rules } from './rules.js';
class GameScene extends BattleScene${sceneType} { constructor() { super({ recipes: [createBattlePresentationRecipe()] }); } getBattle() { return {}; } getBattleRules() { return rules; } isPlayerTurn() { return false; } chooseAiCommand(${actorParameters}) { return { id: 'wait', actorId }; } }
const controls = document.querySelector('#controls');
if (controls) controls.textContent = 'The sample resolves one game-owned command.';
new Phaser.Game({ type: Phaser.AUTO, parent: 'game', width: 760, height: 480, backgroundColor: '#171525', scene: [GameScene] });`,
    [`src/game.test.${ext}`]: `import { expect, test } from 'vitest';
import { Battle } from '@phaser-game-engines/turn-based-battle/headless';
import { rules } from './rules.js';
test('rules finish independently of Phaser', () => { const battle = new Battle({}, { rules }); battle.start(); battle.submitCommand({ id: 'wait', actorId: 'player' }); expect(battle.state.machine.phase).toBe('finished'); });`,
  };
}

function touchSetup(action) {
  return `const touchPanel = document.createElement('div');
touchPanel.setAttribute('aria-label', 'Touch controls');
touchPanel.style.cssText = 'display:flex;gap:8px;align-items:center;margin:12px 0;touch-action:none';
for (const { label, x, y } of [
  { label: '←', x: -1, y: 0 }, { label: '→', x: 1, y: 0 },
  { label: '↑', x: 0, y: -1 }, { label: '↓', x: 0, y: 1 },
]) {
  const button = document.createElement('button');
  button.type = 'button'; button.textContent = label; button.setAttribute('aria-label', 'Move ' + label);
  button.addEventListener('pointerdown', event => { event.preventDefault(); inputAdapter.setMove(x, y); });
  for (const name of ['pointerup', 'pointercancel', 'pointerleave']) button.addEventListener(name, () => inputAdapter.setMove(0, 0));
  touchPanel.append(button);
}
const touchAction = document.createElement('button');
touchAction.type = 'button'; touchAction.textContent = '${action}'; touchAction.setAttribute('aria-label', '${action}');
touchAction.addEventListener('pointerdown', event => { event.preventDefault(); inputAdapter.setAction('${action}', true); });
for (const name of ['pointerup', 'pointercancel', 'pointerleave']) touchAction.addEventListener(name, () => inputAdapter.setAction('${action}', false));
touchPanel.append(touchAction);
document.querySelector('main')?.append(touchPanel);\n`;
}
