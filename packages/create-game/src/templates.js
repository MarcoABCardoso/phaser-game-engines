const recommendedRecipes = Object.freeze({
  platformer: 'precision-platformer',
  'top-down': 'exploration',
  battle: 'menu-presentation',
});

export function recommendedRecipe(genre) {
  return recommendedRecipes[genre];
}

export function recommendedFiles({ genre, extension: ext, input, recipe, features }) {
  const files = {
    [`src/main.${ext}`]: mainSource(genre, ext, input),
    [`src/scenes/TitleScene.${ext}`]: titleSceneSource(ext),
    [`src/scenes/ResultScene.${ext}`]: resultSceneSource(ext),
    [`src/scenes/GameScene.${ext}`]: gameSceneSource(genre, ext, input, recipe, features),
    [`src/content/level.${ext}`]: levelSource(genre),
    [`src/rules/game-rules.${ext}`]: rulesSource(genre, ext),
    [`src/presentation/presentation.${ext}`]: presentationSource(ext),
    [`src/input/controls.${ext}`]: controlsSource(input, genre, ext),
    [`src/tests/rules.test.${ext}`]: rulesTestSource(genre),
    'public/assets/README.md': assetsReadme(),
    'src/style.css': styles(),
  };
  if (ext === 'ts') files['src/vite-env.d.ts'] = `/// <reference types="vite/client" />`;
  if (genre !== 'battle') files[`src/entities/GoalEntity.${ext}`] = goalEntitySource(genre, ext);
  if (features.save || features.debug || features.replay) {
    files[`src/session.${ext}`] = sessionSource(ext, features);
  }
  if (features.save) files[`src/tests/save.test.${ext}`] = saveTestSource();
  if (features.debug) files[`src/tests/debug.test.${ext}`] = debugTestSource();
  if (features.replay) files[`src/tests/replay.test.${ext}`] = replayTestSource(ext);
  return files;
}

function type(ext, annotation) { return ext === 'ts' ? annotation : ''; }

function mainSource(genre, ext, input) {
  return `import Phaser from 'phaser';
import './style.css';
import { TitleScene } from './scenes/TitleScene.js';
import { GameScene } from './scenes/GameScene.js';
import { ResultScene } from './scenes/ResultScene.js';
import { installControls } from './input/controls.js';

const game = new Phaser.Game({
  type: Phaser.AUTO, parent: 'game', width: 960, height: 540,
  backgroundColor: '${genre === 'battle' ? '#171525' : '#101827'}',
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: ${genre === 'platformer' ? 1000 : 0} } } },
  input: { gamepad: true }, scene: [TitleScene, GameScene, ResultScene],
});

installControls({
  start: () => game.scene.start('play'),
  action: () => game.scene.${ext === 'ts' ? `getScene<GameScene>('play')` : `getScene('play')`}?.performAction?.(),
});
`;
}

function titleSceneSource(ext) {
  return `import Phaser from 'phaser';
import { addHeading, addHelp } from '../presentation/presentation.js';

export class TitleScene extends Phaser.Scene {
  constructor() { super('title'); }
  create() {
    addHeading(this, 'Signal Run');
    addHelp(this, 'Reach the signal. Learn the controls below, then start.');
    this.input.keyboard?.once('keydown-ENTER', () => this.scene.start('play'));
    this.input.once('pointerdown', () => this.scene.start('play'));
  }
  update() {
    if (this.input.gamepad?.getPad(0)?.buttons?.[0]?.pressed) this.scene.start('play');
  }
}
`;
}

function resultSceneSource(ext) {
  return `import Phaser from 'phaser';
import { addHeading, addHelp } from '../presentation/presentation.js';

export class ResultScene extends Phaser.Scene {
  constructor() { super('result'); }
  create(data${type(ext, ': { won?: boolean }')}) {
    addHeading(this, data.won === false ? 'Try again' : 'Signal reached!');
    addHelp(this, 'Press Enter, gamepad A, or tap to restart.');
    this.input.keyboard?.once('keydown-ENTER', () => this.scene.start('play'));
    this.input.once('pointerdown', () => this.scene.start('play'));
  }
  update() {
    if (this.input.gamepad?.getPad(0)?.buttons?.[0]?.pressed) this.scene.start('play');
  }
}
`;
}

function levelSource(genre) {
  if (genre === 'platformer') return `import { defineLevel } from '@phaser-game-engines/toolkit/core';

export const level = defineLevel({
  schemaVersion: 1,
  world: { width: 960, height: 540 }, spawn: { x: 70, y: 430 },
  floorSegments: [{ x: 0, y: 500, w: 960, h: 40 }],
  platforms: [{ x: 260, y: 420, w: 150, h: 20 }, { x: 520, y: 350, w: 150, h: 20 }],
  entitySpecs: [{ schemaVersion: 1, type: 'signal-goal', id: 'signal', x: 865, y: 440 }],
});
`;
  if (genre === 'top-down') return `import { defineLevel } from '@phaser-game-engines/toolkit/core';

export const level = defineLevel({
  schemaVersion: 1,
  world: { width: 960, height: 540 }, spawn: { x: 90, y: 270 },
  walls: [
    { x: 300, y: 100, w: 32, h: 280 }, { x: 590, y: 180, w: 32, h: 280 },
  ],
  entitySpecs: [{ schemaVersion: 1, type: 'signal-goal', id: 'signal', x: 850, y: 270 }],
});
`;
  return `export const battleSpec = { playerResolve: 2, rivalResolve: 2, turn: 0 };
`;
}

function rulesSource(genre, ext) {
  if (genre !== 'battle') return `export function reachedGoal(player${type(ext, ': { x: number, y: number }')}, goal${type(ext, ': { x: number, y: number }')}, radius = 48) {
  return Math.hypot(player.x - goal.x, player.y - goal.y) <= radius;
}
`;
  return `${ext === 'ts' ? `import type { BattleRules } from '@phaser-game-engines/toolkit/battle/headless';\n\n` : ''}

${ext === 'js' ? '' : ''}export const rules${type(ext, ': BattleRules<{ playerResolve: number, rivalResolve: number, turn: number }, { playerResolve: number, rivalResolve: number, turn: number }, { kind: string }>')} = {
  createInitialState: (spec${type(ext, ': { playerResolve: number, rivalResolve: number, turn: number }')}) => ({ ...spec }),
  getTurnOrder: () => ['player', 'rival'],
  getAvailableCommands: (_state${type(ext, ': unknown')}, actorId${type(ext, ': string | number')}) => [{ id: 'focus', actorId }],
  resolveCommand: (state${type(ext, ': { playerResolve: number, rivalResolve: number, turn: number }')}, command${type(ext, ': { actorId?: string | number }')}) => ({ state: command.actorId === 'player'
    ? { ...state, rivalResolve: state.rivalResolve - 1, turn: state.turn + 1 }
    : { ...state, playerResolve: state.playerResolve - 1, turn: state.turn + 1 } }),
  getOutcome: (state${type(ext, ': { playerResolve: number, rivalResolve: number }')}) => state.rivalResolve <= 0 ? { kind: 'won' }
    : state.playerResolve < 0 ? { kind: 'lost' } : null,
};
`;
}

function goalEntitySource(genre, ext) {
  const pkg = genre === 'platformer' ? 'platformer' : 'top-down';
  const behavior = genre === 'platformer'
    ? `if (Math.abs(scene.player.x - this.spec.x) < 42) scene.completeGame();`
    : `if (Math.hypot(scene.player.x - this.spec.x, scene.player.y - this.spec.y) < 58) scene.offerContextualAction({ id: 'activate-signal', label: 'Press interact to activate signal', execute: () => scene.completeGame() });`;
  return `${ext === 'ts' ? `import type Phaser from 'phaser';\n` : ''}import { Entity } from '@phaser-game-engines/toolkit/${pkg}';

export class GoalEntity extends ${ext === 'ts' ? '(Entity as any)' : 'Entity'} {
  ${ext === 'ts' ? 'marker?: Phaser.GameObjects.Star; declare spec: { x: number, y: number };' : ''}
  spawn(scene${type(ext, ': any')}) {
    this.marker = scene.add.star(this.spec.x, this.spec.y, 6, 12, 28, 0xffd166).setDepth(5);
  }
  update(scene${type(ext, ': any')}) { ${behavior} }
  destroy() { this.marker?.destroy(); }
}
`;
}

function gameSceneSource(genre, ext, input, recipe, features) {
  const sessionImport = features.save || features.debug || features.replay
    ? `import { session } from '../session.js';\n` : '';
  const debugMechanic = features.debug ? `mechanics: [session.debugMechanic]` : '';
  const record = features.replay ? `session.recordIntent(this.inputIntent);` : '';
  const save = features.save ? `session.save({ completed: true });` : '';
  if (genre === 'battle') return battleSceneSource(ext, input, sessionImport, save);
  const isPlatformer = genre === 'platformer';
  const EngineScene = isPlatformer ? 'PlatformerScene' : 'TopDownScene';
  const pkg = isPlatformer ? 'platformer' : 'top-down';
  const recipeName = recipe === 'precision-platformer' ? 'createPrecisionPlatformerRecipe'
    : recipe === 'action-adventure' ? 'createActionAdventureRecipe'
      : recipe === 'exploration' ? 'createExplorationRecipe' : null;
  const imports = recipeName ? `, ${recipeName}` : '';
  const recipes = recipeName ? `recipes: [${recipeName}()], ` : '';
  return `import { ${EngineScene}${imports}, validate${isPlatformer ? 'Platformer' : 'TopDown'}Level } from '@phaser-game-engines/toolkit/${pkg}';
import { level } from '../content/level.js';
import { GoalEntity } from '../entities/GoalEntity.js';
import { readIntent, controlsLabel } from '../input/controls.js';
import { installHud, installPauseMenu, playCue, updatePlayerPresentation } from '../presentation/presentation.js';
${sessionImport}
export class GameScene extends ${EngineScene} {
  ${ext === 'ts' ? 'hud!: ReturnType<typeof installHud>;' : ''}
  constructor() { super({ key: 'play', ${recipes}entityTypes: { 'signal-goal': GoalEntity }, ${debugMechanic} }); }
  getLevel() { validate${isPlatformer ? 'Platformer' : 'TopDown'}Level(level, { types: ${ext === 'ts' ? "({ 'signal-goal': GoalEntity } as any)" : "{ 'signal-goal': GoalEntity }"} }); return level; }
  readInputIntent() { return readIntent(this) ?? super.readInputIntent(); }
  create() { super.create(); this.hud = installHud(this, 'Objective: reach the gold signal'); this.hud.setControls(controlsLabel); installPauseMenu(this); }
  update(time${type(ext, ': number')}, delta${type(ext, ': number')}) { super.update(time, delta); ${record} updatePlayerPresentation(this, time); }
  performAction() {}
  completeGame() { ${save} playCue(this, 'win'); this.scene.start('result', { won: true }); }
}
`;
}

function battleSceneSource(ext, input, sessionImport, save) {
  return `${ext === 'ts' ? `import type Phaser from 'phaser';\n` : ''}import { BattleScene, createBattlePresentationRecipe } from '@phaser-game-engines/toolkit/battle';
import { battleSpec } from '../content/level.js';
import { rules } from '../rules/game-rules.js';
import { addHelp, playCue } from '../presentation/presentation.js';
${sessionImport}
export class GameScene extends BattleScene${type(ext, '<{ playerResolve: number, rivalResolve: number, turn: number }, { playerResolve: number, rivalResolve: number, turn: number }, { kind: string }>')} {
  ${ext === 'ts' ? 'status!: Phaser.GameObjects.Text;' : ''}
  constructor() { super({ key: 'play', recipes: [createBattlePresentationRecipe({ reducedMotion: true })] }); }
  getBattle() { return battleSpec; }
  getBattleRules() { return rules; }
  isPlayerTurn(id${type(ext, ': string | number')}) { return id === 'player'; }
  getMenuOptions(_state${type(ext, ': unknown')}, actorId${type(ext, ': string | number')}) { return [{ label: 'Focus signal', command: { id: 'focus', actorId } }]; }
  getTargetOptions() { return []; }
  chooseAiCommand(_state${type(ext, ': unknown')}, actorId${type(ext, ': string | number')}) { return { id: 'focus', actorId }; }
  createBattleDisplay() { this.status = addHelp(this, 'Reduce the rival signal to zero.'); }
  renderBattleState(state${type(ext, ': any')}) {
    this.status.setText('Your signal: ' + state.data.playerResolve + '\\nRival signal: ' + state.data.rivalResolve);
    if (state.machine.phase === 'finished') { ${save} playCue(this, 'win'); this.time.delayedCall(250, () => this.scene.start('result', { won: state.machine.outcome?.kind === 'won' })); }
  }
  performAction() { if (this.battle?.state.machine.phase === 'command-selection' && this.battle.state.machine.activeId === 'player') this.submitBattleCommand({ id: 'focus', actorId: 'player' }); }
}
`;
}

function controlsSource(input, genre, ext) {
  const action = genre === 'platformer' ? 'jump' : 'interact';
  if (input === 'keyboard') return `export const controlsLabel = '${genre === 'battle' ? 'Enter/Z: act' : `Arrows/WASD: move · ${genre === 'platformer' ? 'Space/Up: jump' : 'E: interact'}`}';
export function readIntent(_scene${type(ext, ': unknown')}) { return null; }
export function installControls(actions${type(ext, ': { start: () => void, action: () => void }')}) { document.querySelector('#start-button')?.addEventListener('click', actions.start); }
`;
  if (input === 'gamepad') return `import { createGamepadInputAdapter } from '@phaser-game-engines/toolkit/core';
const adapter = createGamepadInputAdapter();
export const controlsLabel = 'Gamepad: left stick/D-pad · A: ${action}';
export function readIntent(_scene${type(ext, ': unknown')}) { return adapter.read(); }
export function installControls(actions${type(ext, ': { start: () => void, action: () => void }')}) { document.querySelector('#start-button')?.addEventListener('click', actions.start); }
`;
  return `import { createTouchInputAdapter } from '@phaser-game-engines/toolkit/core';
const adapter = createTouchInputAdapter({ actions: ['${action}'] });
export const controlsLabel = 'Touch: direction pad · ${action} button';
export function readIntent(_scene${type(ext, ': unknown')}) { return adapter.read(); }
export function installControls(actions${type(ext, ': { start: () => void, action: () => void }')}) {
  const panel = document.querySelector${ext === 'ts' ? '<HTMLElement>' : ''}('#touch-controls');
  if (!panel) return;
  panel.hidden = false;
  for (const button of panel.${ext === 'ts' ? `querySelectorAll<HTMLButtonElement>('[data-x]')` : `querySelectorAll('[data-x]')`}) {
    const move = () => adapter.setMove(Number(button.dataset.x), Number(button.dataset.y));
    button.addEventListener('pointerdown', move);
    for (const event of ['pointerup', 'pointercancel', 'pointerleave']) button.addEventListener(event, () => adapter.setMove(0, 0));
  }
  panel.querySelector('[data-action]')?.addEventListener('pointerdown', () => { adapter.setAction('${action}', true); actions.action(); });
  panel.querySelector('[data-action]')?.addEventListener('pointerup', () => adapter.setAction('${action}', false));
  document.querySelector('#start-button')?.addEventListener('click', actions.start);
}
`;
}

function presentationSource(ext) {
  return `import Phaser from 'phaser';

export function addHeading(scene${type(ext, ': Phaser.Scene')}, text${type(ext, ': string')}) { return scene.add.text(480, 170, text, { fontFamily: 'system-ui', fontSize: '48px', color: '#ffd166' }).setOrigin(0.5); }
export function addHelp(scene${type(ext, ': Phaser.Scene')}, text${type(ext, ': string')}) { return scene.add.text(480, 270, text, { fontFamily: 'system-ui', fontSize: '20px', color: '#e5e7eb', align: 'center' }).setOrigin(0.5); }
export function installHud(scene${type(ext, ': Phaser.Scene')}, objective${type(ext, ': string')}) {
  const text = scene.add.text(12, 12, objective, { fontFamily: 'system-ui', fontSize: '17px', color: '#fff', backgroundColor: '#0009', padding: { x: 8, y: 6 } }).setScrollFactor(0).setDepth(1000);
  return { setControls(value${type(ext, ': string')}) { text.setText(objective + '\\n' + value); }, destroy() { text.destroy(); } };
}
export function updatePlayerPresentation(scene${type(ext, ': any')}, _time${type(ext, ': number')}) { scene.player?.setFillStyle?.(scene.playerMoving ? 0x72ddf7 : 0x6bb8ff); }
export function playCue(_scene${type(ext, ': Phaser.Scene')}, name${type(ext, ': string')}) { console.info('[audio seam]', name); }
export function installPauseMenu(scene${type(ext, ': Phaser.Scene')}) {
  const label = scene.add.text(480, 270, 'PAUSED\\nPress P to continue', { fontFamily: 'system-ui', fontSize: '28px', color: '#fff', backgroundColor: '#000c', align: 'center', padding: { x: 20, y: 14 } }).setOrigin(0.5).setScrollFactor(0).setDepth(2000).setVisible(false);
  scene.input.keyboard?.on('keydown-P', () => { const paused = !scene.physics.world.isPaused; if (paused) scene.physics.pause(); else scene.physics.resume(); label.setVisible(paused); });
  return label;
}
`;
}

function sessionSource(ext, features) {
  const imports = [];
  if (features.save) imports.push('createLocalStorageAdapter', 'createSaveStore');
  if (features.debug) imports.push('createDebugEventLog', 'createDebugOverlayMechanic');
  if (features.replay) imports.push('createSessionRecorder');
  const lines = [`import { ${imports.join(', ')} } from '@phaser-game-engines/toolkit/core';`];
  if (features.save) lines.push(`const saves = createSaveStore({ storage: createLocalStorageAdapter()${type(ext, ' as any')} });`);
  if (features.debug) lines.push(`const debugLog = createDebugEventLog();`);
  if (features.replay) lines.push(`const recorder = createSessionRecorder({ clock: { now: () => performance.now() }${type(ext, ' as any')} });`);
  lines.push(`export const session = {`);
  lines.push(features.save ? `  save: (state${type(ext, ': unknown')}) => saves.save('autosave', state), load: () => saves.load('autosave', undefined),` : `  save() {}, load: () => ({ ok: false, reason: 'disabled' }),`);
  lines.push(features.debug ? `  debugLog, debugMechanic: createDebugOverlayMechanic(),` : `  debugLog: null, debugMechanic: () => () => {},`);
  lines.push(features.replay ? `  recordIntent: (intent${type(ext, ': unknown')}) => recorder.recordIntent(intent), recording: () => recorder.snapshot(),` : `  recordIntent() {}, recording: () => ({ version: 1, entries: [] }),`);
  lines.push(`};`);
  return lines.join('\n');
}

function rulesTestSource(genre) {
  if (genre === 'battle') return `import { expect, test } from 'vitest';
import { Battle } from '@phaser-game-engines/toolkit/battle/headless';
import { battleSpec } from '../content/level.js';
import { rules } from '../rules/game-rules.js';
test('game-owned rules reach a deterministic result', () => { const battle = new Battle(battleSpec, { rules }); battle.start(); battle.submitCommand({ id: 'focus', actorId: 'player' }); battle.submitCommand({ id: 'focus', actorId: 'rival' }); battle.submitCommand({ id: 'focus', actorId: 'player' }); expect(battle.state.machine.outcome).toEqual({ kind: 'won' }); });
`;
  const validator = genre === 'platformer' ? 'validatePlatformerLevel' : 'validateTopDownLevel';
  const pkg = genre === 'platformer' ? 'platformer' : 'top-down';
  return `import { expect, test } from 'vitest';
import { ${validator} } from '@phaser-game-engines/toolkit/${pkg}/headless';
import { level } from '../content/level.js';
import { reachedGoal } from '../rules/game-rules.js';
test('content and objective are valid without Phaser', () => { expect(() => ${validator}(level, { types: { 'signal-goal': class {} } })).not.toThrow(); expect(reachedGoal({ x: 10, y: 10 }, { x: 10, y: 10 })).toBe(true); });
`;
}

function saveTestSource() { return `import { expect, test } from 'vitest'; import { createMemoryStorage, createSaveStore } from '@phaser-game-engines/toolkit/core'; test('autosave state round-trips', () => { const saves = createSaveStore({ storage: createMemoryStorage() }); saves.save('auto', { completed: true }); expect(saves.load('auto', undefined)).toMatchObject({ ok: true, value: { completed: true } }); });`; }
function debugTestSource() { return `import { expect, test } from 'vitest'; import { createDebugEventLog } from '@phaser-game-engines/toolkit/core'; test('debug events stay inspectable', () => { const log = createDebugEventLog(); log.emit('won', { score: 1 }); expect(log.snapshot()).toEqual([{ type: 'won', payload: { score: 1 } }]); });`; }
function replayTestSource(ext) { return `import { expect, test } from 'vitest'; import { createManualClock, createSessionRecorder, replaySession } from '@phaser-game-engines/toolkit/core'; test('recorded input replays headlessly', () => { const clock = createManualClock(); const recorder = createSessionRecorder({ clock: clock${type(ext, ' as any')} }); recorder.recordIntent({ move: { x: 1, y: 0 } }); const seen${type(ext, ': number[]')} = []; replaySession(recorder.snapshot(), { onIntent: (intent${type(ext, ': any')}) => seen.push(intent.move.x) }); expect(seen).toEqual([1]); });`; }

function assetsReadme() { return `# Presentation assets\n\nPut game-owned sprites, animation sheets, and audio here. Replace the shape/text hooks in \`src/presentation/presentation.*\`; no engine subclass or package source edit is required.\n`; }
function styles() { return `:root{font-family:system-ui;color:#e5e7eb;background:#070b14}body{margin:0}main{max-width:960px;margin:auto;padding:12px}canvas{max-width:100%;height:auto}button{font:inherit;padding:.65rem 1rem;margin:.2rem;touch-action:none}#touch-controls[hidden]{display:none}`; }

export function recommendedIndexHtml(genre, ext) {
  return `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${genre} signal run</title></head><body><main><div id="game"></div><button id="start-button">Start / restart</button><div id="touch-controls" hidden aria-label="Touch controls"><button data-x="-1" data-y="0">←</button><button data-x="1" data-y="0">→</button><button data-x="0" data-y="-1">↑</button><button data-x="0" data-y="1">↓</button><button data-action>Action</button></div></main><script type="module" src="/src/main.${ext}"></script></body></html>`;
}
