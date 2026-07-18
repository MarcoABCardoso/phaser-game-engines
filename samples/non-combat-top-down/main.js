import Phaser from 'phaser';
import { TopDownScene } from '@phaser-game-engines/top-down';
import { installSurveyHud } from './hud.js';
import { specimenCount, surveyLevel } from './level.js';

class BotanicalSurveyScene extends TopDownScene {
  constructor() {
    super({ key: 'botanical-survey' });
    this.observations = new Set();
    installSurveyHud(this, specimenCount);
  }

  getLevel() {
    return surveyLevel;
  }

  onInteract(entity) {
    if (this.observations.has(entity.id)) return;

    this.observations.add(entity.id);
    entity.sprite?.setStrokeStyle(3, 0xf2ffd8);

    if (this.observations.size === specimenCount) {
      this.showMessage(
        'Survey complete: four distinct adaptations recorded.',
        4000,
      );
    }
  }
}

const gameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 960,
  height: 540,
  backgroundColor: '#1d3429',
  physics: {
    default: 'arcade',
    arcade: { debug: false },
  },
  scene: [BotanicalSurveyScene],
};

new Phaser.Game(gameConfig);
