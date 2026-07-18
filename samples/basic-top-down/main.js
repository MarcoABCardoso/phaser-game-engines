import Phaser from 'phaser';
import {
  ACTION_ADVENTURE_ENTITY_TYPES,
  TopDownScene,
  createActionAdventureMechanic,
} from '@phaser-game-engines/top-down';
import { basicTopDownLevel } from './level.js';

class BasicTopDownScene extends TopDownScene {
  constructor() {
    super({
      entityTypes: ACTION_ADVENTURE_ENTITY_TYPES,
      mechanics: [createActionAdventureMechanic()],
    });
  }

  getLevel() {
    return basicTopDownLevel;
  }

  onEnterArea(areaId, entry) {
    this.cameras.main.fadeOut(220);
    this.cameras.main.once(
      Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
      () => this.finishAreaTransition(areaId, entry),
    );
  }

  finishAreaTransition(areaId, entry) {
    this.player.setPosition(entry.x, entry.y);
    this.cameras.main.fadeIn(220);
    this.showMessage(
      areaId === 'grove' ? 'Grove reached.' : 'Back in the village.',
    );
    this.transitioning = false;
  }
}

const gameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 960,
  height: 540,
  backgroundColor: '#18212d',
  physics: {
    default: 'arcade',
    arcade: { debug: false },
  },
  scene: [BasicTopDownScene],
};

new Phaser.Game(gameConfig);
