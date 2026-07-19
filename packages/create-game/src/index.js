import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, join, relative, resolve } from 'node:path';
import { recommendedFiles, recommendedIndexHtml, recommendedRecipe } from './templates.js';

export const genres = Object.freeze(['platformer', 'top-down', 'battle']);
export const languages = Object.freeze(['js', 'ts']);
export const inputAdapters = Object.freeze(['keyboard', 'gamepad', 'touch']);
export const templates = Object.freeze(['minimal', 'recommended']);
export const optionalFeatures = Object.freeze(['save', 'debug', 'replay']);
export const recipes = Object.freeze({
  platformer: ['minimal', 'precision-platformer'],
  'top-down': ['minimal', 'exploration', 'action-adventure'],
  battle: ['minimal', 'menu-presentation'],
});
export const packageVersion = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
).version;

export const usage = `Usage:
  npm create @phaser-game-engines/game -- <directory> [options]
  create-phaser-game-engines <directory> [options]

Options:
  --genre platformer|top-down|battle   Starter genre (default: platformer)
  --language js|ts                     Source language (default: js)
  --template minimal|recommended       Project depth (default: recommended)
  --recipe <name>                      Genre composition (template default)
  --input keyboard|gamepad|touch       Input adapter (default: keyboard)
  --save                               Include a working local save seam
  --debug                              Include a development debug overlay
  --replay                             Include input recording and replay
  --deploy none|github-pages|static    Add a deployment preset or guide
  --yes                                Accept defaults without prompts
  --package-source <repository>        Use packages from a local workspace
  --version                            Show the generator version
  --help                               Show this help`;

export function createProject({
  targetDirectory,
  genre = 'platformer',
  language = 'js',
  template = 'minimal',
  recipe,
  input = 'keyboard',
  save = false,
  debug = false,
  replay = false,
  deploy = 'none',
  packageSource,
  packageVersion: requestedPackageVersion = packageVersion,
} = {}) {
  if (!targetDirectory) throw new TypeError('targetDirectory is required.');
  if (!genres.includes(genre)) throw new TypeError(`Unsupported genre: ${genre}.`);
  if (!languages.includes(language)) throw new TypeError(`Unsupported language: ${language}.`);
  if (!templates.includes(template)) throw new TypeError(`Unsupported template: ${template}.`);
  recipe ??= template === 'recommended' ? recommendedRecipe(genre) : 'minimal';
  if (!recipes[genre].includes(recipe)) throw new TypeError(`Recipe ${recipe} is not available for ${genre}.`);
  if (!inputAdapters.includes(input)) throw new TypeError(`Unsupported input adapter: ${input}.`);
  if (template === 'minimal' && genre === 'battle' && input !== 'keyboard') {
    throw new TypeError('The minimal battle starter currently supports keyboard menu input only.');
  }
  if (!['none', 'github-pages', 'static'].includes(deploy)) throw new TypeError(`Unsupported deployment preset: ${deploy}.`);

  const target = resolve(targetDirectory);
  if (existsSync(target) && readdirSync(target).length > 0) {
    throw new Error(`Target directory is not empty: ${target}`);
  }
  mkdirSync(join(target, 'src'), { recursive: true });
  const extension = language;
  const projectName = packageName(basename(target));
  const files = starterFiles({
    target,
    projectName,
    genre,
    language,
    extension,
    recipe,
    template,
    input,
    features: { save: Boolean(save), debug: Boolean(debug), replay: Boolean(replay) },
    deploy,
    packageSource,
    packageVersion: requestedPackageVersion,
  });
  for (const [name, contents] of Object.entries(files)) {
    const path = join(target, name);
    mkdirSync(resolve(path, '..'), { recursive: true });
    writeFileSync(path, contents.endsWith('\n') ? contents : `${contents}\n`);
  }
  return Object.freeze({ targetDirectory: target, genre, language, template, recipe, input, save: Boolean(save), debug: Boolean(debug), replay: Boolean(replay), deploy, files: Object.keys(files) });
}

function packageName(value) {
  const normalized = value.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
  return normalized || 'phaser-game';
}

function toolkitDependency(packageSource, target, version) {
  if (!packageSource) return `^${version}`;
  const path = relative(target, join(packageSource, 'packages', 'toolkit')).replaceAll('\\', '/');
  return `file:${path || '.'}`;
}

function starterFiles(options) {
  const { target, projectName, genre, language, extension, template, recipe, input, features, deploy, packageSource, packageVersion } = options;
  const dependencies = {
    '@phaser-game-engines/toolkit': toolkitDependency(packageSource, target, packageVersion),
    phaser: '^3.90.0',
  };
  const devDependencies = { vite: '^8.1.5', vitest: '^4.1.10' };
  if (language === 'ts') devDependencies.typescript = '^7.0.2';

  const common = {
    'package.json': JSON.stringify({
      name: projectName,
      private: true,
      version: '0.0.0',
      type: 'module',
      scripts: { dev: 'vite', build: 'vite build', test: 'vitest run', verify: `npm test${language === 'ts' ? ' && npm run typecheck' : ''} && npm run build`, ...(language === 'ts' ? { typecheck: 'tsc --noEmit' } : {}), ...(deploy === 'github-pages' ? { deploy: 'vite build' } : {}) },
      dependencies,
      devDependencies,
    }, null, 2),
    'index.html': template === 'recommended' ? recommendedIndexHtml(genre, extension) : indexHtml(genre, extension),
    '.gitignore': 'node_modules/\ndist/',
    'README.md': starterReadme({ genre, language, template, recipe, input, features, deploy }),
  };
  if (language === 'ts') common['tsconfig.json'] = JSON.stringify({ compilerOptions: {
    target: 'ES2022', useDefineForClassFields: true, module: 'ESNext', moduleResolution: 'Bundler',
    strict: true, noEmit: true, skipLibCheck: true,
  }, include: ['src/**/*.ts'] }, null, 2);
  const generated = template === 'recommended'
    ? recommendedFiles({ genre, extension, recipe, input, features })
    : genreFiles(genre, extension, recipe, input);
  return { ...common, ...generated, ...deploymentFiles(deploy) };
}

function indexHtml(genre, extension) {
  return `<!doctype html>
<html lang="en">
  <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${genre} starter</title></head>
  <body><main><h1>${genre} starter</h1><p id="controls"></p><div id="game"></div></main><script type="module" src="/src/main.${extension}"></script></body>
</html>`;
}

function starterReadme({ genre, language, template, recipe, input, features, deploy }) {
  const projectGuide = template === 'recommended' ? `
## Where to make changes

| Change | File | Owner |
| --- | --- | --- |
| ${genre === 'battle' ? 'Initial battle state' : 'Layout, spawn, or goal position'} | \`src/content/level.${language}\` | Your game content |
| Victory or defeat conditions | \`src/rules/game-rules.${language}\` | Your pure game rules |
| Applying an outcome, saving, or changing scenes | \`src/scenes/GameScene.${language}\` | Your game orchestration |
${genre === 'battle' ? '' : `| Goal appearance | \`src/entities/GoalEntity.${language}\` | Your entity presentation |\n`}| HUD, audio, or visual feedback | \`src/presentation/presentation.${language}\` | Your presentation |
| Phaser text styles | \`src/presentation/styles.${language}\` | Your presentation theme |
| Browser layout and controls | \`src/style.css\` | Your browser styles |
| Controls | \`src/input/controls.${language}\` | Your input adapter |

The toolkit owns movement, physics adaptation, entity scheduling, validation,
and lifecycle timing. The generated \`GameScene\` connects those package hooks to
your content, rules, and presentation.${genre === 'battle' ? '' : ` In particular, entities do not end the
stage: \`GameScene.onTick()\` gathers runtime facts, calls
\`getStageOutcome()\`, and applies the returned outcome once.`}

The player is a persistent, scene-owned actor because movement, physics,
camera follow, and area transitions all operate on it directly. Entries in
\`entitySpecs\` are area-scoped world entities and are rebuilt when an area changes.

\`src/input/controls.${language}\` exports the adapter passed to the scene as
\`super({ controls })\`. Add or remap keyboard/gamepad names in
\`bindings.actions\`. In touch projects, add an \`actionButtons\` entry to create
both the named action and its on-screen button.
` : '';
  return `# ${genre} starter

Generated as a ${language.toUpperCase()} ${template} ${genre} project using the ${recipe} recipe and ${input} input.

Run \`npm install\`, then \`npm run dev\`. Use \`npm run verify\` before shipping; it runs headless rules tests${language === 'ts' ? ', type checking,' : ''} and a production build.

${template === 'recommended' ? 'The game loop is title → controls → play → result → restart.' : 'This minimal template is an import and movement proof, not a complete game loop.'} ${template === 'recommended' ? 'Content, rules, presentation, input, and scene orchestration have explicit owners.' : ''}${Object.entries(features).filter(([, enabled]) => enabled).length ? ` Optional working seams: ${Object.entries(features).filter(([, enabled]) => enabled).map(([name]) => name).join(', ')}.` : ''}
${projectGuide}
${deploy === 'none' ? '' : `\nDeployment instructions are in \`DEPLOYMENT.md\`.`}
`;
}

function deploymentFiles(deploy) {
  if (deploy === 'none') return {};
  if (deploy === 'github-pages') return {
    'vite.config.js': `import { defineConfig } from 'vite';\nexport default defineConfig(({ mode }) => ({ base: mode === 'production' ? './' : '/' }));`,
    '.github/workflows/deploy.yml': `name: Deploy game\non:\n  push:\n    branches: [main]\n  workflow_dispatch:\npermissions:\n  contents: read\n  pages: write\n  id-token: write\nconcurrency:\n  group: pages\n  cancel-in-progress: true\njobs:\n  deploy:\n    environment:\n      name: github-pages\n      url: \${{ steps.deployment.outputs.page_url }}\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with: { node-version: 22, cache: npm }\n      - run: npm ci\n      - run: npm run build\n      - uses: actions/upload-pages-artifact@v3\n        with: { path: dist }\n      - id: deployment\n        uses: actions/deploy-pages@v4`,
    'DEPLOYMENT.md': '# Deploy to GitHub Pages\n\nPush to `main`, then enable **Settings → Pages → GitHub Actions**. The included workflow builds and deploys `dist/`; the relative Vite base works for repository subpaths.\n',
  };
  return { 'DEPLOYMENT.md': '# Deploy to a static host\n\nRun `npm run build`, then publish the generated `dist/` directory to Netlify, Cloudflare Pages, Render, or any static host. Build command: `npm run build`. Publish directory: `dist`. For a subpath deployment, add `vite.config.js` with `base: \'/your-path/\'`.\n' };
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
import { PlatformerScene } from '@phaser-game-engines/toolkit/platformer';
${adapter.imports}${adapter.declaration}class GameScene extends PlatformerScene {
${adapter.method}  getLevel() { return { world: { width: 960, height: 540 }, spawn: { x: 80, y: 420 }, floorSegments: [{ x: 0, y: 500, w: 960, h: 40 }], platforms: [], entitySpecs: [] }; }
}
${adapter.setup}const controls = document.querySelector('#controls');
if (controls) controls.textContent = 'Move: arrows/A-D. Jump: Space/Up.';
new Phaser.Game({ type: Phaser.AUTO, parent: 'game', width: 960, height: 540, backgroundColor: '#12151d', physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 1000 } } }, scene: [GameScene] });`,
    [`src/game.test.${ext}`]: `import { expect, test } from 'vitest';
import { createTraversalController } from '@phaser-game-engines/toolkit/platformer/headless';
test('traversal starts from deterministic state', () => expect(createTraversalController().snapshot().facingDir).toBe(1));`,
  };
}

function topDownFiles(ext, recipe, input) {
  const adapter = realTimeInput(input, 'interact');
  const recipeImports = recipe === 'action-adventure' ? ', createActionAdventureRecipe' : '';
  const constructor = recipe === 'action-adventure' ? `  constructor() { super({ recipes: [createActionAdventureRecipe()] }); }\n` : '';
  return {
    [`src/main.${ext}`]: `import Phaser from 'phaser';
import { TopDownScene${recipeImports} } from '@phaser-game-engines/toolkit/top-down';
${adapter.imports}${adapter.declaration}class GameScene extends TopDownScene {
${constructor}${adapter.method}  getLevel() { return { world: { width: 960, height: 540 }, spawn: { x: 80, y: 80 }, walls: [], entitySpecs: [] }; }
}
${adapter.setup}const controls = document.querySelector('#controls');
if (controls) controls.textContent = 'Move: arrows/WASD. Interact: E.';
new Phaser.Game({ type: Phaser.AUTO, parent: 'game', width: 960, height: 540, backgroundColor: '#18212d', physics: { default: 'arcade' }, scene: [GameScene] });`,
    [`src/game.test.${ext}`]: `import { expect, test } from 'vitest';
import { movementFromIntent } from '@phaser-game-engines/toolkit/top-down/headless';
test('movement is deterministic', () => expect(movementFromIntent({ x: 1, y: 0 }, 200)).toEqual({ x: 200, y: 0 }));`,
  };
}

function realTimeInput(input, action) {
  if (input === 'keyboard') return { imports: '', declaration: '', method: '', setup: '' };
  if (input === 'gamepad') {
    return {
      imports: `import { createGamepadInputAdapter } from '@phaser-game-engines/toolkit/core';\n`,
      declaration: `const inputAdapter = createGamepadInputAdapter();\n`,
      method: `  readInputIntent() { return inputAdapter.read(); }\n`,
      setup: '',
    };
  }
  return {
    imports: `import { createTouchInputAdapter } from '@phaser-game-engines/toolkit/core';\n`,
    declaration: `const inputAdapter = createTouchInputAdapter({ actions: ['${action}'] });\n`,
    method: `  readInputIntent() { return inputAdapter.read(); }\n`,
    setup: touchSetup(action),
  };
}

function battleFiles(ext) {
  const typedImport = ext === 'ts'
    ? `import type { BattleRules } from '@phaser-game-engines/toolkit/battle/headless';\n`
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
import { BattleScene, createBattlePresentationRecipe } from '@phaser-game-engines/toolkit/battle';
import { rules } from './rules.js';
class GameScene extends BattleScene${sceneType} { constructor() { super({ recipes: [createBattlePresentationRecipe()] }); } getBattle() { return {}; } getBattleRules() { return rules; } isPlayerTurn() { return false; } chooseAiCommand(${actorParameters}) { return { id: 'wait', actorId }; } }
const controls = document.querySelector('#controls');
if (controls) controls.textContent = 'The sample resolves one game-owned command.';
new Phaser.Game({ type: Phaser.AUTO, parent: 'game', width: 760, height: 480, backgroundColor: '#171525', scene: [GameScene] });`,
    [`src/game.test.${ext}`]: `import { expect, test } from 'vitest';
import { Battle } from '@phaser-game-engines/toolkit/battle/headless';
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
