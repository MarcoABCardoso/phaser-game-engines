import { helpTextStyle } from './styles.js';

export function createBattleStatus({ scene, model }) {
  const text = scene.add.text(480, 270, '', helpTextStyle).setOrigin(0.5);
  const update = (state) => {
    text.setText('Your signal: ' + state.playerResolve + '\nRival signal: ' + state.rivalResolve);
  };
  update(model);
  return { root: text, update };
}

export const gamePresentation = {
  presenters: { 'battle.status': createBattleStatus },
};

export function playCue(_scene, name) {
  console.info('[audio seam]', name);
}
