import Phaser from 'phaser';
import {
  createGamepadInputAdapter,
  createInputIntent,
  createKeyboardInputAdapter,
  createTouchInputAdapter,
} from '@phaser-game-engines/toolkit/core';

export const explorationBindings = Object.freeze({
  move: Object.freeze({
    left: Object.freeze(['ArrowLeft', 'KeyA']),
    right: Object.freeze(['ArrowRight', 'KeyD']),
    up: Object.freeze(['ArrowUp', 'KeyW']),
    down: Object.freeze(['ArrowDown', 'KeyS']),
  }),
  actions: Object.freeze({ interact: Object.freeze(['KeyE']) }),
});

const keyboardControls = createKeyboardInputAdapter({
  bindings: explorationBindings,
  labels: { KeyE: 'E' },
});

const gamepadControls = createGamepadInputAdapter({
  bindings: {
    move: { xAxis: 0, yAxis: 1, left: [14], right: [15], up: [12], down: [13] },
    actions: { interact: [0] },
  },
  labels: { 0: 'A' },
});

export const touchControls = createTouchInputAdapter({
  actions: ['interact'],
  labels: { interact: 'Action' },
});

function mergeIntents(intents) {
  const actionNames = new Set(intents.flatMap((intent) => Object.keys(intent.actions ?? {})));
  const actions = Object.fromEntries([...actionNames].map((name) => [name, {
    pressed: intents.some((intent) => intent.actions?.[name]?.pressed),
    down: intents.some((intent) => intent.actions?.[name]?.down),
    released: intents.some((intent) => intent.actions?.[name]?.released),
  }]));
  const movement = intents.reduce((best, intent) => {
    const magnitude = Math.hypot(intent.move?.x ?? 0, intent.move?.y ?? 0);
    return magnitude > best.magnitude ? { magnitude, move: intent.move } : best;
  }, { magnitude: 0, move: { x: 0, y: 0 } });
  return createInputIntent({ move: movement.move, actions, meta: { source: 'composed' } });
}

export const explorationControls = Object.freeze({
  read() { return mergeIntents([keyboardControls.read(), gamepadControls.read(), touchControls.read()]); },
  reset() { keyboardControls.reset(); gamepadControls.reset(); touchControls.reset(); },
  getPrompt(action) {
    return `${keyboardControls.getPrompt(action)} / ${gamepadControls.getPrompt(action)} / ${touchControls.getPrompt(action)}`;
  },
});

export const battleControls = Object.freeze({
  keys: Object.freeze({
    up: Phaser.Input.Keyboard.KeyCodes.UP,
    down: Phaser.Input.Keyboard.KeyCodes.DOWN,
    confirm: Phaser.Input.Keyboard.KeyCodes.Z,
    confirmAlternate: Phaser.Input.Keyboard.KeyCodes.ENTER,
    cancel: Phaser.Input.Keyboard.KeyCodes.X,
    cancelAlternate: Phaser.Input.Keyboard.KeyCodes.ESC,
  }),
  gamepad: true,
  confirmButton: 0,
  cancelButton: 1,
});

export const controlsLabel = [
  'Explore: arrows/WASD, gamepad, or touch pad',
  `Talk / interact: ${explorationControls.getPrompt('interact')}`,
  'Battle: arrows + Z/Enter; X/Escape cancels',
  'Inventory: I; drag/touch or arrows + Z/A; S sorts',
  'Gamepad: D-pad/stick + A; B cancels',
].join(' · ');

export function installBrowserControls({ action, alternate, inventory, menu, restart }) {
  document.querySelector('#action-button')?.addEventListener('click', action);
  document.querySelector('#restart-button')?.addEventListener('click', restart);
  document.querySelector('#inventory-button')?.addEventListener('click', inventory);
  document.querySelector('#menu-button')?.addEventListener('click', menu);
  document.querySelector('#alternate-button')?.addEventListener('click', alternate);
  const directions = {
    'move-up': { x: 0, y: -1 },
    'move-down': { x: 0, y: 1 },
    'move-left': { x: -1, y: 0 },
    'move-right': { x: 1, y: 0 },
  };
  for (const [id, move] of Object.entries(directions)) {
    const button = document.querySelector(`#${id}`);
    const start = (event) => { event.preventDefault(); touchControls.setMove(move.x, move.y); };
    const stop = (event) => { event.preventDefault(); touchControls.setMove(0, 0); };
    button?.addEventListener('pointerdown', start);
    button?.addEventListener('pointerup', stop);
    button?.addEventListener('pointercancel', stop);
    button?.addEventListener('pointerleave', stop);
  }
  const summary = document.querySelector('#controls-summary');
  if (summary) summary.textContent = controlsLabel;
}
