import { createKeyboardInputAdapter } from '@phaser-game-engines/toolkit/core';

// Add or remap actions here. The scene receives every named action in controls.read().
export const bindings = {
  move: {},
  actions: {
    confirm: ['Enter', 'KeyZ'],
  },
};

export const controls = createKeyboardInputAdapter({ bindings });
const actionPrompts = Object.keys(bindings.actions)
  .map((name) => name + ': ' + controls.getPrompt(name));
export const controlsLabel = [...actionPrompts].join(' · ');

export function installBrowserControls(actions) {
  document.querySelector('#start-button')?.addEventListener('click', actions.start);
}
