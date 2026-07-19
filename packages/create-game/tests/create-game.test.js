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

  it('uses the hosted toolkit package and ordinary Vite command by default', () => {
    const target = join(temporaryRoot(), 'hosted-toolkit-default');
    createProject({ targetDirectory: target, genre: 'top-down', template: 'recommended' });
    const manifest = JSON.parse(readFileSync(join(target, 'package.json'), 'utf8'));
    expect(manifest.dependencies['@phaser-game-engines/toolkit']).toBe(`^${packageVersion}`);
    expect(manifest.scripts.dev).toBe('vite');
  });

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
    expect(result.files).toContain('src/presentation/styles.js');
    expect(result.files).toContain('public/assets/README.md');
    expect(readFileSync(join(target, 'README.md'), 'utf8')).toContain('title → controls → play → result → restart');
  });

  it.each(['top-down', 'battle'])('stops active flow scenes before the %s browser button starts play', (genre) => {
    const target = join(temporaryRoot(), `browser-start-${genre}`);
    createProject({ targetDirectory: target, genre, template: 'recommended' });
    const main = readFileSync(join(target, 'src/main.js'), 'utf8');
    expect(main).toContain("for (const key of ['title', 'play', 'result'])");
    expect(main).toContain('if (game.scene.isActive(key)) game.scene.stop(key)');
    expect(main).toContain('start: startGame');
  });

  it.each(['platformer', 'top-down'])('keeps %s stage outcomes out of entities', (genre) => {
    const target = join(temporaryRoot(), `outcome-owner-${genre}`);
    createProject({ targetDirectory: target, genre, template: 'recommended' });

    const scene = readFileSync(join(target, 'src/scenes/GameScene.js'), 'utf8');
    const entity = readFileSync(join(target, 'src/entities/GoalEntity.js'), 'utf8');
    const rules = readFileSync(join(target, 'src/rules/game-rules.js'), 'utf8');

    expect(scene).toContain("import { getStageOutcome } from '../rules/game-rules.js'");
    expect(scene).toContain('const outcome = getStageOutcome');
    expect(scene).toContain('if (outcome) this.finishStage(outcome)');
    expect(scene).toContain('if (this.stageFinished) return');
    expect(scene).not.toContain('completeGame');
    expect(entity).not.toContain('update(');
    expect(entity).not.toContain('scene.start');
    expect(rules).toContain('export function getStageOutcome');
  });

  it('uses the top-down Arcade body center for contact completion', () => {
    const target = join(temporaryRoot(), 'top-down-contact');
    createProject({ targetDirectory: target, genre: 'top-down', template: 'recommended' });
    const scene = readFileSync(join(target, 'src/scenes/GameScene.js'), 'utf8');
    expect(scene).toContain('body?.center ?? this.player');
    expect(scene).toContain('this.evaluateStageOutcome(playerPosition)');
    expect(scene).toContain('onGoalContact(goal)');
    expect(scene).toContain('this.evaluateStageOutcome(goal.spec)');
    const entity = readFileSync(join(target, 'src/entities/GoalEntity.js'), 'utf8');
    expect(entity).toContain('scene.physics.add.overlap');
    expect(entity).toContain('scene.onGoalContact?.(this)');
  });

  it.each(['platformer', 'top-down'])('injects explicit %s controls for every device', (genre) => {
    const root = temporaryRoot();
    const keyboardTarget = join(root, `${genre}-keyboard-owner`);
    const gamepadTarget = join(root, `${genre}-gamepad-owner`);
    createProject({ targetDirectory: keyboardTarget, genre, template: 'recommended', input: 'keyboard' });
    createProject({ targetDirectory: gamepadTarget, genre, template: 'recommended', input: 'gamepad' });

    const keyboardScene = readFileSync(join(keyboardTarget, 'src/scenes/GameScene.js'), 'utf8');
    const keyboardControls = readFileSync(join(keyboardTarget, 'src/input/controls.js'), 'utf8');
    const gamepadScene = readFileSync(join(gamepadTarget, 'src/scenes/GameScene.js'), 'utf8');
    const gamepadControls = readFileSync(join(gamepadTarget, 'src/input/controls.js'), 'utf8');

    expect(keyboardScene).toContain("import { controls, controlsLabel } from '../input/controls.js'");
    expect(keyboardScene).toContain('controls,');
    expect(keyboardScene).not.toMatch(/\n  readInputIntent\(\)/);
    expect(keyboardControls).toContain('createKeyboardInputAdapter');
    expect(keyboardControls).toContain('export const bindings');
    expect(keyboardControls).toContain('export const controls');
    expect(gamepadScene).toContain('controls,');
    expect(gamepadScene).not.toMatch(/\n  readInputIntent\(\)/);
    expect(gamepadControls).toContain('createGamepadInputAdapter');
  });

  it.each(['platformer', 'top-down'])('derives %s touch buttons from action definitions', (genre) => {
    const target = join(temporaryRoot(), `${genre}-touch-actions`);
    createProject({ targetDirectory: target, genre, template: 'recommended', input: 'touch' });

    const controls = readFileSync(join(target, 'src/input/controls.js'), 'utf8');
    const html = readFileSync(join(target, 'index.html'), 'utf8');
    expect(controls).toContain('export const actionButtons');
    expect(controls).toContain('actions: actionButtons.map');
    expect(controls).toContain('for (const definition of actionButtons)');
    expect(html).toContain('<div id="touch-controls" hidden aria-label="Touch controls"></div>');
    expect(html).not.toContain('data-action');
  });

  it('keeps Phaser text styles out of presentation behavior', () => {
    const target = join(temporaryRoot(), 'presentation-styles');
    createProject({ targetDirectory: target, genre: 'platformer', template: 'recommended' });
    const presentation = readFileSync(join(target, 'src/presentation/presentation.js'), 'utf8');
    const styles = readFileSync(join(target, 'src/presentation/styles.js'), 'utf8');

    expect(presentation).toContain("from './styles.js'");
    expect(presentation).not.toContain('fontFamily');
    expect(styles).toContain('export const headingTextStyle');
    expect(styles).toContain('export const pauseTextStyle');
  });

  it('derives top-down movement presentation from Arcade velocity', () => {
    const target = join(temporaryRoot(), 'top-down-moving-presentation');
    createProject({ targetDirectory: target, genre: 'top-down', template: 'recommended' });
    const presentation = readFileSync(join(target, 'src/presentation/presentation.js'), 'utf8');
    expect(presentation).toContain('scene.player?.body?.velocity');
    expect(presentation).toContain('Math.hypot');
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

  it('renders recommended battle state from the controller game field', () => {
    const target = join(temporaryRoot(), 'battle-state-shape');
    createProject({ targetDirectory: target, genre: 'battle', template: 'recommended' });
    const scene = readFileSync(join(target, 'src/scenes/GameScene.js'), 'utf8');
    expect(scene).toContain('state.game.playerResolve');
    expect(scene).toContain('state.game.rivalResolve');
    expect(scene).not.toContain('state.data');
  });

  it('generates distinct recommended battle actions', () => {
    const target = join(temporaryRoot(), 'battle-actions');
    createProject({ targetDirectory: target, genre: 'battle', template: 'recommended' });
    const rules = readFileSync(join(target, 'src/rules/game-rules.js'), 'utf8');
    const scene = readFileSync(join(target, 'src/scenes/GameScene.js'), 'utf8');
    expect(rules).toContain("{ id: 'focus', actorId }");
    expect(rules).toContain("{ id: 'overload', actorId }");
    expect(scene).toContain('Overload (-1 self, -2 rival)');
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
