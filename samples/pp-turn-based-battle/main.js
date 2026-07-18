import Phaser from 'phaser';
import PpBattleScene from './scene.js';

const gameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 760,
  height: 480,
  backgroundColor: '#183122',
  scene: [PpBattleScene],
};

new Phaser.Game(gameConfig);
