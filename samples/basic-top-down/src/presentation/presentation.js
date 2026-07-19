import Phaser from 'phaser';
import {
  headingTextStyle,
  helpTextStyle,
  hudTextStyle,
  pauseTextStyle,
} from './styles.js';

export function addHeading(scene, text) {
  return scene.add.text(480, 170, text, headingTextStyle).setOrigin(0.5);
}

export function addHelp(scene, text) {
  return scene.add.text(480, 270, text, helpTextStyle).setOrigin(0.5);
}

export function installHud(scene, objective) {
  const text = scene.add.text(12, 12, objective, hudTextStyle)
    .setScrollFactor(0)
    .setDepth(1000);

  return {
    setControls(value) {
      text.setText(objective + '\n' + value);
    },
    destroy() {
      text.destroy();
    },
  };
}

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
