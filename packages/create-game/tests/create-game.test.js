import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import {
  createProject,
  genres,
  inputAdapters,
  languages,
  packageVersion,
} from '../src/index.js';

const temporaryDirectories = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0).reverse()) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('project generator', () => {
  it('reports public command help without requiring a target directory', () => {
    const result = runCli('--help');
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('npm create @phaser-game-engines/game');
    expect(result.stdout).toContain('--package-source');
  });

  it('reports the package version without requiring a target directory', () => {
    const result = runCli('--version');
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe(packageVersion);
  });

  it.each(genres.flatMap((genre) => languages.map((language) => [genre, language]))) (
    'creates a minimal %s %s project with a headless test',
    (genre, language) => {
      const root = temporaryRoot();
      const target = join(root, `${genre}-${language}`);
      const result = createProject({ targetDirectory: target, genre, language });
      const extension = language;

      expect(result.files).toContain(`src/main.${extension}`);
      expect(result.files).toContain(`src/game.test.${extension}`);
      expect(readFileSync(join(target, 'index.html'), 'utf8')).toContain(`/src/main.${extension}`);
      expect(readFileSync(join(target, `src/game.test.${extension}`), 'utf8')).toContain('/headless');
      if (language === 'ts') expect(result.files).toContain('tsconfig.json');
    },
  );

  it('supports the opt-in top-down action-adventure recipe', () => {
    const target = join(temporaryRoot(), 'action-game');
    createProject({ targetDirectory: target, genre: 'top-down', recipe: 'action-adventure' });
    expect(readFileSync(join(target, 'src/main.js'), 'utf8')).toContain('createActionAdventureRecipe');
  });

  it.each(genres)('creates a recommended %s vertical slice with separate content, rules, presentation, and scenes', (genre) => {
    const target = join(temporaryRoot(), `recommended-${genre}`);
    const result = createProject({ targetDirectory: target, genre, template: 'recommended' });
    expect(result.template).toBe('recommended');
    expect(result.files).toContain('src/scenes/TitleScene.js');
    expect(result.files).toContain('src/scenes/ResultScene.js');
    expect(result.files).toContain('src/content/level.js');
    expect(result.files).toContain('src/rules/game-rules.js');
    expect(result.files).toContain('src/presentation/presentation.js');
    expect(result.files).toContain('public/assets/README.md');
    expect(readFileSync(join(target, 'README.md'), 'utf8')).toContain('title → controls → play → result → restart');
  });

  it('generates working optional seams and their focused tests', () => {
    const target = join(temporaryRoot(), 'full-tooling');
    const result = createProject({ targetDirectory: target, template: 'recommended', save: true, debug: true, replay: true });
    expect(result.files).toEqual(expect.arrayContaining([
      'src/session.js', 'src/tests/save.test.js', 'src/tests/debug.test.js', 'src/tests/replay.test.js',
    ]));
    expect(readFileSync(join(target, 'src/session.js'), 'utf8')).toContain('createSaveStore');
  });

  it.each(['github-pages', 'static'])('adds the %s deployment path', (deploy) => {
    const target = join(temporaryRoot(), `deploy-${deploy}`);
    const result = createProject({ targetDirectory: target, template: 'recommended', deploy });
    expect(result.files).toContain('DEPLOYMENT.md');
    if (deploy === 'github-pages') {
      expect(result.files).toContain('.github/workflows/deploy.yml');
      expect(readFileSync(join(target, 'vite.config.js'), 'utf8')).toContain("base: mode === 'production' ? './' : '/'");
    }
  });

  it('makes the recommended template the non-interactive CLI default while --template minimal remains stable', () => {
    const root = temporaryRoot();
    const recommended = runCli(join(root, 'recommended'), '--yes');
    expect(recommended.status).toBe(0);
    expect(readFileSync(join(root, 'recommended', 'src/scenes/TitleScene.js'), 'utf8')).toContain('TitleScene');
    const minimal = runCli(join(root, 'minimal'), '--template', 'minimal', '--yes');
    expect(minimal.status).toBe(0);
    expect(readFileSync(join(root, 'minimal', 'src/main.js'), 'utf8')).toContain('class GameScene');
  });

  it.each(inputAdapters)('generates the selected %s input integration', (input) => {
    const target = join(temporaryRoot(), `input-${input}`);
    createProject({ targetDirectory: target, genre: 'platformer', input });
    const source = readFileSync(join(target, 'src/main.js'), 'utf8');
    if (input === 'keyboard') expect(source).not.toContain('InputAdapter');
    else expect(source).toContain(input === 'gamepad' ? 'createGamepadInputAdapter' : 'createTouchInputAdapter');
  });

  it('rejects unsupported device integration for the minimal battle menu', () => {
    expect(() => createProject({
      targetDirectory: join(temporaryRoot(), 'battle-touch'), genre: 'battle', input: 'touch',
    })).toThrow(/keyboard menu input only/);
  });

  it.each(['gamepad', 'touch'])('makes recommended battle playable with %s input', (input) => {
    const target = join(temporaryRoot(), `battle-${input}`);
    createProject({ targetDirectory: target, genre: 'battle', template: 'recommended', input });
    expect(readFileSync(join(target, 'src/scenes/GameScene.js'), 'utf8')).toContain('performAction');
  });

  it('uses local workspace dependencies when requested', () => {
    const root = temporaryRoot();
    const workspace = join(root, 'workspace');
    const target = join(root, 'game');
    mkdirSync(join(workspace, 'packages', 'toolkit'), { recursive: true });
    createProject({ targetDirectory: target, packageSource: workspace });
    const manifest = JSON.parse(readFileSync(join(target, 'package.json'), 'utf8'));
    expect(manifest.dependencies['@phaser-game-engines/toolkit']).toBe('file:../workspace/packages/toolkit');
  });

  it('refuses to write into a non-empty directory', () => {
    const target = join(temporaryRoot(), 'existing');
    mkdirSync(target);
    writeFileSync(join(target, 'notes.txt'), 'keep me');
    expect(() => createProject({ targetDirectory: target })).toThrow(/not empty/);
    expect(readFileSync(join(target, 'notes.txt'), 'utf8')).toBe('keep me');
  });
});

function temporaryRoot() {
  const directory = mkdtempSync(join(tmpdir(), 'create-phaser-game-'));
  temporaryDirectories.push(directory);
  return directory;
}

function runCli(...args) {
  return spawnSync(process.execPath, [
    fileURLToPath(new URL('../bin/create-game.js', import.meta.url)),
    ...args,
  ], { encoding: 'utf8' });
}
