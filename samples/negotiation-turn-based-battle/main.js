import Phaser from 'phaser';
import NegotiationScene from './scene.js';

const gameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 760,
  height: 480,
  backgroundColor: '#29223b',
  scene: [NegotiationScene],
};

new Phaser.Game(gameConfig);
