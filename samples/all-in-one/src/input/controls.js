import Phaser from 'phaser';
import { createKeyboardInputAdapter } from '@phaser-game-engines/toolkit/core';

export const explorationBindings = Object.freeze({
  move: Object.freeze({
    left: Object.freeze(['ArrowLeft', 'KeyA']),
    right: Object.freeze(['ArrowRight', 'KeyD']),
    up: Object.freeze(['ArrowUp', 'KeyW']),
    down: Object.freeze(['ArrowDown', 'KeyS']),
  }),
  actions: Object.freeze({ interact: Object.freeze(['KeyE']) }),
});

export const explorationControls = createKeyboardInputAdapter({
  bindings: explorationBindings,
  labels: { KeyE: 'E' },
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
  'Explore: arrows/WASD',
  `Interact: ${explorationControls.getPrompt('interact')}`,
  'Battle: arrows + Z/Enter; X/Escape cancels',
  'Inventory: I; drag items; S sorts',
  'Gamepad: D-pad/stick + A; B cancels',
].join(' · ');

export function installBrowserControls({ action, inventory, restart }) {
  document.querySelector('#action-button')?.addEventListener('click', action);
  document.querySelector('#restart-button')?.addEventListener('click', restart);
  document.querySelector('#inventory-button')?.addEventListener('click', inventory);
  const summary = document.querySelector('#controls-summary');
  if (summary) summary.textContent = controlsLabel;
}
