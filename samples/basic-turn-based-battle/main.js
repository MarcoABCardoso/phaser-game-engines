import Phaser from 'phaser';
import BasicBattleScene from './scene.js';

const gameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 760,
  height: 480,
  backgroundColor: '#171525',
  scene: [BasicBattleScene],
};

new Phaser.Game(gameConfig);
