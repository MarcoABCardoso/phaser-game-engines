import Phaser from 'phaser';
import { hudTextStyle, pauseTextStyle } from './styles.js';

export function createPlayer({ scene, x, y }) {
  return scene.add.rectangle(x, y, 22, 22, 0x6bb8ff);
}

export function createGoal({ scene, spec }) {
  return scene.add.star(spec.x, spec.y, 6, 12, 28, 0xffd166).setDepth(5);
}

export function createHud({ scene, model }) {
  const text = scene.add.text(12, 12, '', hudTextStyle)
    .setScrollFactor(0)
    .setDepth(1000);
  const update = (next) => {
    text.setText(next.objective + '\n' + next.controls);
  };
  update(model);
  return { root: text, update };
}

export const gamePresentation = {
  prefabs: { player: createPlayer, goal: createGoal },
  presenters: { 'game.hud': createHud },
};

export function updatePlayerPresentation(scene, _time) {
  const velocity = scene.player?.body?.velocity;
  const moving = typeof scene.playerMoving === 'boolean'
    ? scene.playerMoving
    : Math.hypot(velocity?.x ?? 0, velocity?.y ?? 0) > 1;
  scene.player?.setFillStyle?.(moving ? 0x72ddf7 : 0x6bb8ff);
}

export function playCue(_scene, name) {
  console.info('[audio seam]', name);
}

export function installPauseMenu(scene) {
  const label = scene.add.text(480, 270, 'PAUSED\nPress P to continue', pauseTextStyle)
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
