import Phaser from 'phaser';
import { PlatformerScene } from '@phaser-game-engines/platformer';
import { basicLevel } from './level.js';

class BasicPlatformerScene extends PlatformerScene {
  getLevel() {
    return basicLevel;
  }

  jumpVelocity() { return -450; }
  moveMaxSpeed() { return 220; }
  coyoteMs() { return 100; }
  jumpBufferMs() { return 100; }
}

const gameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 960,
  height: 540,
  backgroundColor: '#12151d',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 1000 },
      debug: false,
    },
  },
  scene: [BasicPlatformerScene],
};

new Phaser.Game(gameConfig);
