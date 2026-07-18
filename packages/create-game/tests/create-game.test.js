import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createProject, genres, inputAdapters, languages } from '../src/index.js';

const temporaryDirectories = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0).reverse()) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('project generator', () => {
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

  it('uses local workspace dependencies when requested', () => {
    const root = temporaryRoot();
    const workspace = join(root, 'workspace');
    const target = join(root, 'game');
    mkdirSync(join(workspace, 'packages', 'platformer'), { recursive: true });
    createProject({ targetDirectory: target, packageSource: workspace });
    const manifest = JSON.parse(readFileSync(join(target, 'package.json'), 'utf8'));
    expect(manifest.dependencies['@phaser-game-engines/platformer']).toBe('file:../workspace/packages/platformer');
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
