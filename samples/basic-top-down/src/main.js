import Phaser from 'phaser';
import './style.css';
import { TitleScene } from './scenes/TitleScene.js';
import { GameScene } from './scenes/GameScene.js';
import { ResultScene } from './scenes/ResultScene.js';
import { installBrowserControls } from './input/controls.js';

const game = new Phaser.Game({
  type: Phaser.AUTO, parent: 'game', width: 960, height: 540,
  backgroundColor: '#101827',
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 } } },
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
  action: () => game.scene.getScene('play')?.performAction?.(),
});
