import Phaser from 'phaser';
import {
  PlatformerScene,
  createPrecisionPlatformerRecipe,
  createTraversalTuningMechanic,
} from '@phaser-game-engines/platformer';
import { replaceRecipePolicy } from '@phaser-game-engines/core';
import { basicLevel } from './level.js';

class BasicPlatformerScene extends PlatformerScene {
  constructor() {
    const precision = createPrecisionPlatformerRecipe();
    const tuned = replaceRecipePolicy(
      precision,
      'traversal',
      createTraversalTuningMechanic({
        jumpVelocity: -450,
        maxSpeed: 220,
        acceleration: 1500,
        groundDrag: 1900,
        airDrag: 120,
        coyoteMs: 100,
        jumpBufferMs: 100,
      }),
    );
    super({ recipes: [tuned] });
  }

  getLevel() {
    return basicLevel;
  }

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
