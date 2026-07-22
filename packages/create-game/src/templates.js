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
    [`src/presentation/styles.${ext}`]: presentationStylesSource(ext),
    [`src/input/controls.${ext}`]: controlsSource(input, genre, ext),
    [`src/tests/rules.test.${ext}`]: rulesTestSource(genre, ext),
    'public/assets/README.md': assetsReadme(),
    'src/style.css': browserStyles(),
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
import { installBrowserControls } from './input/controls.js';

const game = new Phaser.Game({
  type: Phaser.AUTO, parent: 'game', width: 960, height: 540,
  backgroundColor: '${genre === 'battle' ? '#171525' : '#101827'}',
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: ${genre === 'platformer' ? 1000 : 0} } } },
  input: { gamepad: true }, scene: [TitleScene, GameScene, ResultScene],
});

function startGame() {
  for (const key of ['title', 'play', 'result']) {
    if (game.scene.isActive(key)) game.scene.stop(key);
  }
  game.scene.start('play');
}

installBrowserControls({
  start: startGame,
  action: () => game.scene.${ext === 'ts' ? `getScene<GameScene>('play')` : `getScene('play')`}?.performAction?.(),
});
`;
}

function titleSceneSource(ext) {
  return `import Phaser from 'phaser';
import { addHeading, addHelp } from '../presentation/presentation.js';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('title');
  }

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
  constructor() {
    super('result');
  }

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
  return `export const battleSpec = { playerResolve: 3, rivalResolve: 3, turn: 0 };
`;
}

function rulesSource(genre, ext) {
  if (genre !== 'battle') return `export function getStageOutcome(
  state${type(ext, ': { player: { x: number, y: number }, goal: { x: number, y: number } }')},
  radius = 48,
)${type(ext, ": { kind: 'won' } | null")} {
  const { player, goal } = state;
  const reachedGoal = Math.hypot(player.x - goal.x, player.y - goal.y) <= radius;
  return reachedGoal ? { kind: 'won' } : null;
}
`;
  return `${ext === 'ts' ? `import type { BattleRules } from '@phaser-game-engines/toolkit/battle/headless';\n\n` : ''}

${ext === 'js' ? '' : ''}export const rules${type(ext, ': BattleRules<{ playerResolve: number, rivalResolve: number, turn: number }, { playerResolve: number, rivalResolve: number, turn: number }, { kind: string }>')} = {
  createInitialState: (spec${type(ext, ': { playerResolve: number, rivalResolve: number, turn: number }')}) => ({ ...spec }),
  getTurnOrder: () => ['player', 'rival'],
  getAvailableCommands: (_state${type(ext, ': unknown')}, actorId${type(ext, ': string | number')}) => [
    { id: 'focus', actorId },
    { id: 'overload', actorId },
  ],
  resolveCommand: (state${type(ext, ': { playerResolve: number, rivalResolve: number, turn: number }')}, command${type(ext, ": { id: string, actorId?: string | number }")}) => {
    const actorKey = command.actorId === 'player' ? 'playerResolve' : 'rivalResolve';
    const targetKey = command.actorId === 'player' ? 'rivalResolve' : 'playerResolve';
    const next = { ...state, turn: state.turn + 1 };
    next[targetKey] -= command.id === 'overload' ? 2 : 1;
    if (command.id === 'overload') next[actorKey] -= 1;
    return { state: next };
  },
  getOutcome: (state${type(ext, ': { playerResolve: number, rivalResolve: number }')}) => state.rivalResolve <= 0 ? { kind: 'won' }
    : state.playerResolve <= 0 ? { kind: 'lost' } : null,
};
`;
}

function goalEntitySource(genre, ext) {
  const pkg = genre === 'platformer' ? 'platformer' : 'top-down';
  const topDownTypeFields = genre === 'top-down' && ext === 'ts'
    ? '\n  overlap?: Phaser.Physics.Arcade.Collider;' : '';
  const topDownSpawn = genre === 'top-down' ? `
    scene.physics.add.existing(this.marker, true);
    this.overlap = scene.physics.add.overlap(
      scene.player,
      this.marker,
      () => scene.onGoalContact?.(this),
    );` : '';
  const topDownDestroy = genre === 'top-down' ? '\n    this.overlap?.destroy();' : '';
  return `${ext === 'ts' ? `import type Phaser from 'phaser';\n` : ''}import { Entity } from '@phaser-game-engines/toolkit/${pkg}';

export class GoalEntity extends ${ext === 'ts' ? '(Entity as any)' : 'Entity'} {
${ext === 'ts' ? `  marker?: Phaser.GameObjects.Star;${topDownTypeFields}\n  declare spec: { id: string, x: number, y: number };\n` : ''}  spawn(scene${type(ext, ': any')}) {
    this.marker = scene.add.star(this.spec.x, this.spec.y, 6, 12, 28, 0xffd166).setDepth(5);${topDownSpawn}
  }

  destroy() {
    this.marker?.destroy();${topDownDestroy}
  }
}
`;
}

function gameSceneSource(genre, ext, input, recipe, features) {
  const sessionImport = features.save || features.debug || features.replay
    ? `import { session } from '../session.js';\n` : '';
  const debugMechanic = features.debug ? `\n      mechanics: [session.debugMechanic],` : '';
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
  const recipes = recipeName ? `\n      recipes: [${recipeName}()],` : '';
  return `import { ${EngineScene}${imports} } from '@phaser-game-engines/toolkit/${pkg}';
import { level } from '../content/level.js';
import { GoalEntity } from '../entities/GoalEntity.js';
import { controls, controlsLabel } from '../input/controls.js';
import { installHud, installPauseMenu, playCue, updatePlayerPresentation } from '../presentation/presentation.js';
import { getStageOutcome } from '../rules/game-rules.js';
${sessionImport}
export class GameScene extends ${EngineScene} {
${ext === 'ts' ? '  hud!: ReturnType<typeof installHud>;\n  goal!: GoalEntity;\n' : ''}  stageFinished = false;

  constructor() {
    super({
      key: 'play',${recipes}
      controls,
      entityTypes: { 'signal-goal': GoalEntity },${debugMechanic}
    });
  }

  // Toolkit content provider: the base scene validates and builds this level.
  getLevel() {
    return level;
  }

  // Toolkit lifecycle hook: cache the game-owned objective after entities spawn.
  pgeOnEntitiesBuilt() {
    const goal = this.entities?.get('signal');
    if (!goal) throw new Error('Level must contain the signal goal entity.');
    this.goal = goal${type(ext, ' as GoalEntity')};
  }

  // Toolkit lifecycle hook: install game-owned presentation for each scene run.
  pgeOnReady() {
    this.stageFinished = false;
    this.hud = installHud(this, 'Objective: reach the gold signal');
    this.hud.setControls(controlsLabel);
    installPauseMenu(this);
  }

  // Game orchestration: gather runtime facts, ask the pure rule, then apply its outcome.
  pgeOnTick(time${type(ext, ': number')}, _delta${type(ext, ': number')}) {
${record ? `    ${record}\n` : ''}    updatePlayerPresentation(this, time);
    const playerPosition = ${ext === 'ts'
    ? '(this.player!.body as { center?: { x: number, y: number } })?.center ?? this.player!'
    : 'this.player.body?.center ?? this.player'};
    this.evaluateStageOutcome(playerPosition);
  }

  // Top-down goals also report Arcade overlap, so contact cannot be missed between ticks.
  onGoalContact(goal${type(ext, ': GoalEntity')}) {
    if (goal === this.goal) this.evaluateStageOutcome(goal.spec);
  }

  evaluateStageOutcome(playerPosition${type(ext, ': { x: number, y: number }')}) {
    const outcome = getStageOutcome({ player: playerPosition, goal: this.goal.spec });
    if (outcome) this.finishStage(outcome);
  }

  // Browser controls call this seam; frame-based adapters read the action on the next tick.
  performAction() {
    // The selected adapter state is consumed by the next scene tick.
  }

  finishStage(outcome${type(ext, ": { kind: 'won' }")}) {
    if (this.stageFinished) return;
    this.stageFinished = true;
${save ? `    ${save}\n` : ''}    playCue(this, 'win');
    this.scene.start('result', { won: outcome.kind === 'won' });
  }
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
${ext === 'ts' ? '  status!: Phaser.GameObjects.Text;\n' : ''}  constructor() { super({ key: 'play', recipes: [createBattlePresentationRecipe({ reducedMotion: true })] }); }
  getBattle() { return battleSpec; }
  getBattleRules() { return rules; }
  isPlayerTurn(id${type(ext, ': string | number')}) { return id === 'player'; }
  getMenuOptions(_state${type(ext, ': unknown')}, _actorId${type(ext, ': string | number')}) {
    return this.battle${type(ext, '!')}.availableCommands().map((command${type(ext, ': any')}) => ({
      label: command.id === 'overload' ? 'Overload (-1 self, -2 rival)' : 'Focus (-1 rival)',
      command,
    }));
  }
  getTargetOptions() { return []; }
  chooseAiCommand(_state${type(ext, ': unknown')}, actorId${type(ext, ': string | number')}) { return { id: 'focus', actorId }; }
  pgeCreateBattleDisplay() { this.status = addHelp(this, 'Reduce the rival signal to zero.'); }
  pgeRenderBattleState(state${type(ext, ': any')}) {
    this.status.setText('Your signal: ' + state.game.playerResolve + '\\nRival signal: ' + state.game.rivalResolve);
    if (state.machine.phase === 'finished') { ${save} playCue(this, 'win'); this.time.delayedCall(250, () => this.scene.start('result', { won: state.machine.outcome?.kind === 'won' })); }
  }
  performAction() { if (this.battle?.state.machine.phase === 'command-selection' && this.battle.state.machine.activeId === 'player') this.submitBattleCommand({ id: 'focus', actorId: 'player' }); }
}
`;
}

function controlsSource(input, genre, ext) {
  const action = genre === 'platformer' ? 'jump' : genre === 'top-down' ? 'interact' : 'confirm';
  const actionLabel = action[0].toUpperCase() + action.slice(1);
  const movement = genre === 'battle' ? '{}' : `{
    left: ['ArrowLeft', 'KeyA'],
    right: ['ArrowRight', 'KeyD'],
    up: ['ArrowUp', 'KeyW'],
    down: ['ArrowDown', 'KeyS'],
  }`;
  const keyboardButtons = action === 'jump' ? "['Space', 'ArrowUp']"
    : action === 'interact' ? "['KeyE']" : "['Enter', 'KeyZ']";
  if (input === 'keyboard') return `import { createKeyboardInputAdapter } from '@phaser-game-engines/toolkit/core';

// Add or remap actions here. The scene receives every named action in controls.read().
export const bindings = {
  move: ${movement},
  actions: {
    ${action}: ${keyboardButtons},
  },
};

export const controls = createKeyboardInputAdapter({ bindings });
const actionPrompts = Object.keys(bindings.actions)
  .map((name) => name + ': ' + controls.getPrompt(name));
export const controlsLabel = [${genre === 'battle' ? '' : "'Arrows/WASD: move', "}...actionPrompts].join(' · ');

export function installBrowserControls(actions${type(ext, ': { start: () => void, action: (name?: string) => void }')}) {
  document.querySelector('#start-button')?.addEventListener('click', actions.start);
}
`;

  const gamepadMovement = genre === 'battle' ? '{}' : `{
    xAxis: 0,
    yAxis: 1,
    left: [14],
    right: [15],
    up: [12],
    down: [13],
  }`;
  if (input === 'gamepad') return `import { createGamepadInputAdapter } from '@phaser-game-engines/toolkit/core';

// Button numbers use the standard browser Gamepad layout. Add named actions here.
export const bindings = {
  move: ${gamepadMovement},
  actions: {
    ${action}: [0],
  },
};

export const controls = createGamepadInputAdapter({
  bindings,
  labels: { 0: 'A' },
});
const actionPrompts = Object.keys(bindings.actions)
  .map((name) => name + ': ' + controls.getPrompt(name));
export const controlsLabel = ['Gamepad${genre === 'battle' ? '' : ' left stick/D-pad'}', ...actionPrompts].join(' · ');

export function installBrowserControls(actions${type(ext, ': { start: () => void, action: (name?: string) => void }')}) {
  document.querySelector('#start-button')?.addEventListener('click', actions.start);
}
`;

  const directions = genre === 'battle' ? '[]' : `[
  { label: '←', x: -1, y: 0 },
  { label: '→', x: 1, y: 0 },
  { label: '↑', x: 0, y: -1 },
  { label: '↓', x: 0, y: 1 },
]`;
  return `import { createTouchInputAdapter } from '@phaser-game-engines/toolkit/core';

// Add an entry here to create both an input action and its on-screen button.
export const actionButtons = [
  { action: '${action}', label: '${actionLabel}' },
];

export const controls = createTouchInputAdapter({
  actions: actionButtons.map(({ action }) => action),
});
export const controlsLabel = ['Touch${genre === 'battle' ? '' : ' direction pad'}', ...actionButtons.map(({ label }) => label)].join(' · ');

const directions${type(ext, ': { label: string, x: number, y: number }[]')} = ${directions};

export function installBrowserControls(actions${type(ext, ': { start: () => void, action: (name?: string) => void }')}) {
  const panel = document.querySelector${ext === 'ts' ? '<HTMLElement>' : ''}('#touch-controls');
  if (!panel) return;
  panel.hidden = false;

  for (const direction of directions) {
    const button = document.createElement('button');
    button.textContent = direction.label;
    button.addEventListener('pointerdown', () => controls.setMove(direction.x, direction.y));
    for (const event of ['pointerup', 'pointercancel', 'pointerleave']) {
      button.addEventListener(event, () => controls.setMove(0, 0));
    }
    panel.append(button);
  }

  for (const definition of actionButtons) {
    const button = document.createElement('button');
    button.textContent = definition.label;
    button.addEventListener('pointerdown', () => {
      controls.setAction(definition.action, true);
      actions.action(definition.action);
    });
    for (const event of ['pointerup', 'pointercancel', 'pointerleave']) {
      button.addEventListener(event, () => controls.setAction(definition.action, false));
    }
    panel.append(button);
  }

  document.querySelector('#start-button')?.addEventListener('click', actions.start);
}
`;
}

function presentationSource(ext) {
  return `import Phaser from 'phaser';
import {
  headingTextStyle,
  helpTextStyle,
  hudTextStyle,
  pauseTextStyle,
} from './styles.js';

export function addHeading(scene${type(ext, ': Phaser.Scene')}, text${type(ext, ': string')}) {
  return scene.add.text(480, 170, text, headingTextStyle).setOrigin(0.5);
}

export function addHelp(scene${type(ext, ': Phaser.Scene')}, text${type(ext, ': string')}) {
  return scene.add.text(480, 270, text, helpTextStyle).setOrigin(0.5);
}

export function installHud(scene${type(ext, ': Phaser.Scene')}, objective${type(ext, ': string')}) {
  const text = scene.add.text(12, 12, objective, hudTextStyle)
    .setScrollFactor(0)
    .setDepth(1000);

  return {
    setControls(value${type(ext, ': string')}) {
      text.setText(objective + '\\n' + value);
    },
    destroy() {
      text.destroy();
    },
  };
}

export function updatePlayerPresentation(scene${type(ext, ': any')}, _time${type(ext, ': number')}) {
  const velocity = scene.player?.body?.velocity;
  const moving = typeof scene.playerMoving === 'boolean'
    ? scene.playerMoving
    : Math.hypot(velocity?.x ?? 0, velocity?.y ?? 0) > 1;
  scene.player?.setFillStyle?.(moving ? 0x72ddf7 : 0x6bb8ff);
}

export function playCue(_scene${type(ext, ': Phaser.Scene')}, name${type(ext, ': string')}) {
  console.info('[audio seam]', name);
}

export function installPauseMenu(scene${type(ext, ': Phaser.Scene')}) {
  const label = scene.add.text(480, 270, 'PAUSED\\nPress P to continue', pauseTextStyle)
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(2000)
    .setVisible(false);

  const togglePause = () => {
    const paused = !scene.physics.world.isPaused;
    if (paused) scene.physics.pause();
    else scene.physics.resume();
    label.setVisible(paused);
  };

  scene.input.keyboard?.on('keydown-P', togglePause);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.input.keyboard?.off('keydown-P', togglePause);
  });
  return label;
}
`;
}

function presentationStylesSource(ext) {
  const textStyleType = type(ext, ': Phaser.Types.GameObjects.Text.TextStyle');
  return `${ext === 'ts' ? "import type Phaser from 'phaser';\n\n" : ''}export const headingTextStyle${textStyleType} = {
  fontFamily: 'system-ui',
  fontSize: '48px',
  color: '#ffd166',
};

export const helpTextStyle${textStyleType} = {
  fontFamily: 'system-ui',
  fontSize: '20px',
  color: '#e5e7eb',
  align: 'center',
};

export const hudTextStyle${textStyleType} = {
  fontFamily: 'system-ui',
  fontSize: '17px',
  color: '#ffffff',
  backgroundColor: '#00000099',
  padding: { x: 8, y: 6 },
};

export const pauseTextStyle${textStyleType} = {
  fontFamily: 'system-ui',
  fontSize: '28px',
  color: '#ffffff',
  backgroundColor: '#000000cc',
  align: 'center',
  padding: { x: 20, y: 14 },
};
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

function rulesTestSource(genre, ext) {
  if (genre === 'battle') return `import { expect, test } from 'vitest';
import { Battle } from '@phaser-game-engines/toolkit/battle/headless';
import { battleSpec } from '../content/level.js';
import { rules } from '../rules/game-rules.js';
test('game-owned rules expose distinct choices and reach a deterministic result', () => { const battle = new Battle(battleSpec, { rules }); battle.start(); expect(battle.availableCommands().map((command${type(ext, ': any')}) => command.id)).toEqual(['focus', 'overload']); battle.submitCommand({ id: 'overload', actorId: 'player' }); battle.submitCommand({ id: 'focus', actorId: 'rival' }); battle.submitCommand({ id: 'focus', actorId: 'player' }); expect(battle.state.machine.outcome).toEqual({ kind: 'won' }); });
`;
  const validator = genre === 'platformer' ? 'validatePlatformerLevel' : 'validateTopDownLevel';
  const pkg = genre === 'platformer' ? 'platformer' : 'top-down';
  return `import { expect, test } from 'vitest';
import { ${validator} } from '@phaser-game-engines/toolkit/${pkg}/headless';
import { level } from '../content/level.js';
import { getStageOutcome } from '../rules/game-rules.js';

test('content is valid without Phaser', () => {
  expect(() => ${validator}(level, { types: { 'signal-goal': class {} } })).not.toThrow();
});

test('game-owned rules decide whether the stage is complete', () => {
  const goal = { x: 50, y: 50 };
  expect(getStageOutcome({ player: { x: 10, y: 10 }, goal })).toBeNull();
  expect(getStageOutcome({ player: { x: 50, y: 50 }, goal })).toEqual({ kind: 'won' });
});
`;
}

function saveTestSource() { return `import { expect, test } from 'vitest'; import { createMemoryStorage, createSaveStore } from '@phaser-game-engines/toolkit/core'; test('autosave state round-trips', () => { const saves = createSaveStore({ storage: createMemoryStorage() }); saves.save('auto', { completed: true }); expect(saves.load('auto', undefined)).toMatchObject({ ok: true, value: { completed: true } }); });`; }
function debugTestSource() { return `import { expect, test } from 'vitest'; import { createDebugEventLog } from '@phaser-game-engines/toolkit/core'; test('debug events stay inspectable', () => { const log = createDebugEventLog(); log.emit('won', { score: 1 }); expect(log.snapshot()).toEqual([{ type: 'won', payload: { score: 1 } }]); });`; }
function replayTestSource(ext) { return `import { expect, test } from 'vitest'; import { createManualClock, createSessionRecorder, replaySession } from '@phaser-game-engines/toolkit/core'; test('recorded input replays headlessly', () => { const clock = createManualClock(); const recorder = createSessionRecorder({ clock: clock${type(ext, ' as any')} }); recorder.recordIntent({ move: { x: 1, y: 0 } }); const seen${type(ext, ': number[]')} = []; replaySession(recorder.snapshot(), { onIntent: (intent${type(ext, ': any')}) => seen.push(intent.move.x) }); expect(seen).toEqual([1]); });`; }

function assetsReadme() { return `# Presentation assets\n\nPut game-owned sprites, animation sheets, and audio here. Replace the shape/text hooks in \`src/presentation/presentation.*\`; no engine subclass or package source edit is required.\n`; }
function browserStyles() {
  return `:root {
  font-family: system-ui;
  color: #e5e7eb;
  background: #070b14;
}

body {
  margin: 0;
}

main {
  max-width: 960px;
  margin: auto;
  padding: 12px;
}

canvas {
  max-width: 100%;
  height: auto;
}

button {
  margin: 0.2rem;
  padding: 0.65rem 1rem;
  font: inherit;
  touch-action: none;
}

#touch-controls[hidden] {
  display: none;
}

#touch-controls {
  display: flex;
  gap: 8px;
  align-items: center;
  margin: 12px 0;
}
`;
}

export function recommendedIndexHtml(genre, ext) {
  return `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${genre} signal run</title></head><body><main><div id="game"></div><button id="start-button">Start / restart</button><div id="touch-controls" hidden aria-label="Touch controls"></div></main><script type="module" src="/src/main.${ext}"></script></body></html>`;
}
