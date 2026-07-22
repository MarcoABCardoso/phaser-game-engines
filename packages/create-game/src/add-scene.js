import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { recommendedRecipe } from './templates.js';

const genres = Object.freeze(['platformer', 'top-down', 'battle']);
const languages = Object.freeze(['js', 'ts']);
const templates = Object.freeze(['minimal', 'recommended']);
const genreRecipes = Object.freeze({
  platformer: ['minimal', 'precision-platformer'],
  'top-down': ['minimal', 'exploration', 'action-adventure'],
  battle: ['minimal', 'menu-presentation'],
});

export function addScene({
  targetDirectory = '.',
  genre,
  name,
  key,
  language,
  template = 'recommended',
  recipe,
} = {}) {
  if (!genre || !genres.includes(genre)) throw new TypeError(`Unsupported genre: ${genre ?? '<missing>'}.`);
  if (!templates.includes(template)) throw new TypeError(`Unsupported template: ${template}.`);

  const target = resolve(targetDirectory);
  const manifestPath = join(target, 'package.json');
  if (!existsSync(manifestPath)) throw new Error(`Existing project must contain package.json: ${target}`);
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const dependencies = { ...manifest.dependencies, ...manifest.devDependencies };
  if (!dependencies.phaser) throw new Error('Existing project must depend on phaser.');
  if (!dependencies['@phaser-game-engines/toolkit']) {
    throw new Error('Existing project must depend on @phaser-game-engines/toolkit.');
  }

  language ??= inferLanguage(target);
  if (!languages.includes(language)) throw new TypeError(`Unsupported language: ${language}.`);
  name ??= `New${pascalCase(genre)}Scene`;
  if (!/^[A-Z][A-Za-z0-9]*Scene$/.test(name)) {
    throw new TypeError('Scene name must be a PascalCase identifier ending in Scene.');
  }
  if (['PlatformerScene', 'TopDownScene', 'BattleScene'].includes(name)) {
    throw new TypeError(`Scene name ${name} conflicts with a toolkit scene import.`);
  }
  key ??= kebabCase(name.replace(/Scene$/, ''));
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key)) {
    throw new TypeError('Scene key must contain lowercase letters, numbers, and single hyphens.');
  }
  recipe ??= template === 'recommended' ? recommendedRecipe(genre) : 'minimal';
  if (!genreRecipes[genre].includes(recipe)) throw new TypeError(`Recipe ${recipe} is not available for ${genre}.`);
  if (template === 'minimal' && recipe !== 'minimal') {
    throw new TypeError('Minimal added scenes only support the minimal recipe.');
  }

  const extension = language;
  const files = sceneFiles({ genre, name, key, extension, template, recipe });
  const collisions = Object.keys(files).filter((file) => existsSync(join(target, file)));
  if (collisions.length) throw new Error(`Refusing to overwrite existing files: ${collisions.join(', ')}`);

  for (const [file, contents] of Object.entries(files)) {
    const path = join(target, file);
    mkdirSync(resolve(path, '..'), { recursive: true });
    writeFileSync(path, contents.endsWith('\n') ? contents : `${contents}\n`);
  }

  const scenePath = `./scenes/${name}.js`;
  return Object.freeze({
    targetDirectory: target,
    genre,
    language,
    template,
    recipe,
    name,
    key,
    files: Object.keys(files),
    registration: Object.freeze({
      import: `import { ${name} } from '${scenePath}';`,
      scene: name,
    }),
  });
}

function inferLanguage(target) {
  if (existsSync(join(target, 'tsconfig.json'))) return 'ts';
  return 'js';
}

function pascalCase(value) {
  return value.split(/[^a-zA-Z0-9]+/).filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1)).join('');
}

function kebabCase(value) {
  return value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '').toLowerCase();
}

function sceneFiles(options) {
  if (options.template === 'minimal') {
    return { [`src/scenes/${options.name}.${options.extension}`]: minimalScene(options) };
  }
  const slug = kebabCase(options.name.replace(/Scene$/, ''));
  return {
    [`src/scenes/${options.name}.${options.extension}`]: recommendedScene({ ...options, slug }),
    [`src/content/${slug}.${options.extension}`]: contentSource(options.genre),
    [`src/rules/${slug}-rules.${options.extension}`]: rulesSource(options.genre, options.extension),
    [`src/tests/${slug}-rules.test.${options.extension}`]: testSource(options.genre, slug),
  };
}

function minimalScene({ genre, name, key, extension }) {
  const any = extension === 'ts' ? ': any' : '';
  if (genre === 'battle') return `import { BattleScene } from '@phaser-game-engines/toolkit/battle';

const rules = {
  createInitialState: () => ({ turns: 0 }),
  getTurnOrder: () => ['player'],
  getAvailableCommands: () => [{ id: 'finish', actorId: 'player' }],
  resolveCommand: (state${any}) => ({ state: { turns: state.turns + 1 } }),
  getOutcome: (state${any}) => state.turns > 0 ? { kind: 'complete' } : null,
};

export class ${name} extends BattleScene {
  constructor() { super({ key: '${key}' }); }
  getBattle() { return {}; }
  getBattleRules() { return rules; }
}
`;
  const engine = genre === 'platformer' ? 'PlatformerScene' : 'TopDownScene';
  const packageName = genre;
  const extra = genre === 'platformer' ? 'floorSegments: [], platforms: [], ' : 'walls: [], ';
  return `import { ${engine} } from '@phaser-game-engines/toolkit/${packageName}';

export class ${name} extends ${engine} {
  constructor() { super({ key: '${key}' }); }
  getLevel() { return { world: { width: 960, height: 540 }, spawn: { x: 80, y: 80 }, ${extra}entitySpecs: [] }; }
}
`;
}

function recommendedScene({ genre, name, key, recipe, slug, extension }) {
  const any = extension === 'ts' ? ': any' : '';
  if (genre === 'battle') {
    const recipeImport = recipe === 'menu-presentation' ? ', createBattlePresentationRecipe' : '';
    const recipes = recipe === 'menu-presentation' ? ', recipes: [createBattlePresentationRecipe()]' : '';
    return `import { BattleScene${recipeImport} } from '@phaser-game-engines/toolkit/battle';
import { battleSpec } from '../content/${slug}.js';
import { rules } from '../rules/${slug}-rules.js';

export class ${name} extends BattleScene {
  constructor() { super({ key: '${key}'${recipes} }); }
  getBattle() { return battleSpec; }
  getBattleRules() { return rules; }
  isPlayerTurn(id${any}) { return id === 'player'; }
  getMenuOptions() { return this.battle.availableCommands().map((command${any}) => ({ label: command.id, command })); }
  getTargetOptions() { return []; }
  chooseAiCommand(_state${any}, actorId${any}) { return { id: 'wait', actorId }; }
}
`;
  }
  const engine = genre === 'platformer' ? 'PlatformerScene' : 'TopDownScene';
  const recipeImports = {
    'precision-platformer': 'createPrecisionPlatformerRecipe',
    exploration: 'createExplorationRecipe',
    'action-adventure': 'createActionAdventureRecipe',
  };
  const recipeImport = recipeImports[recipe];
  const recipeClause = recipeImport ? `, ${recipeImport}` : '';
  const recipes = recipeImport ? `, recipes: [${recipeImport}()]` : '';
  return `import { ${engine}${recipeClause} } from '@phaser-game-engines/toolkit/${genre}';
import { level } from '../content/${slug}.js';

export class ${name} extends ${engine} {
  constructor() { super({ key: '${key}'${recipes} }); }
  getLevel() { return level; }
}
`;
}

function contentSource(genre) {
  if (genre === 'battle') return `export const battleSpec = { turns: 0 };\n`;
  const geometry = genre === 'platformer' ? 'floorSegments: [],\n  platforms: [],' : 'walls: [],';
  return `import { defineLevel } from '@phaser-game-engines/toolkit/core';

export const level = defineLevel({
  schemaVersion: 1,
  world: { width: 960, height: 540 },
  spawn: { x: 80, y: 80 },
  ${geometry}
  entitySpecs: [],
});
`;
}

function rulesSource(genre, extension) {
  const any = extension === 'ts' ? ': any' : '';
  if (genre === 'battle') return `export const rules = {
  createInitialState: (spec${any}) => ({ ...spec }),
  getTurnOrder: () => ['player'],
  getAvailableCommands: (_state${any}, actorId${any}) => [{ id: 'finish', actorId }],
  resolveCommand: (state${any}) => ({ state: { ...state, turns: state.turns + 1 } }),
  getOutcome: (state${any}) => state.turns > 0 ? { kind: 'complete' } : null,
};
`;
  return `export function sceneIsReady(level${any}) {
  return Boolean(level?.world && level?.spawn && Array.isArray(level.entitySpecs));
}
`;
}

function testSource(genre, slug) {
  if (genre === 'battle') return `import { expect, test } from 'vitest';
import { Battle } from '@phaser-game-engines/toolkit/battle/headless';
import { battleSpec } from '../content/${slug}.js';
import { rules } from '../rules/${slug}-rules.js';

test('generated battle can finish', () => {
  const battle = new Battle(battleSpec, { rules });
  battle.start();
  battle.submitCommand({ id: 'finish', actorId: 'player' });
  expect(battle.state.machine.outcome).toEqual({ kind: 'complete' });
});
`;
  return `import { expect, test } from 'vitest';
import { level } from '../content/${slug}.js';
import { sceneIsReady } from '../rules/${slug}-rules.js';

test('generated scene content is ready', () => expect(sceneIsReady(level)).toBe(true));
`;
}
