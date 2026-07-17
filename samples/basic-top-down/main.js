import Phaser from 'phaser';
import {
  ACTION_ADVENTURE_ENTITY_TYPES,
  TopDownScene,
  createActionAdventureMechanic,
} from '@phaser-game-engines/top-down';

class BasicTopDownScene extends TopDownScene {
  constructor() {
    super({
      entityTypes: ACTION_ADVENTURE_ENTITY_TYPES,
      mechanics: [createActionAdventureMechanic()],
    });
  }
  getLevel() {
    return { world: { width: 1920, height: 540 }, spawn: { x: 100, y: 100 }, walls: [
      // Village (left) and grove (right) are separate map sections, divided by a wall.
      { x: 0, y: 0, w: 1920, h: 24 }, { x: 0, y: 516, w: 1920, h: 24 }, { x: 0, y: 0, w: 24, h: 540 }, { x: 1896, y: 0, w: 24, h: 540 }, { x: 936, y: 0, w: 24, h: 540 }, { x: 360, y: 120, w: 36, h: 270 },
      { x: 1220, y: 110, w: 70, h: 70, color: 0x356047 }, { x: 1460, y: 300, w: 100, h: 45, color: 0x356047 }, { x: 1680, y: 130, w: 55, h: 130, color: 0x356047 },
    ], entitySpecs: [
      { type: 'pickup', id: 'coin', item: 'coin', x: 220, y: 160, goneFlag: 'coin-collected' },
      { type: 'sign', id: 'sign', x: 180, y: 250, zone: { x: 150, y: 220, w: 60, h: 60 }, prompt: 'E: read sign', message: 'The east gate leads to the grove.' },
      { type: 'enemy', id: 'slime', x: 620, y: 240, health: 2 },
      { type: 'portal', id: 'east-gate', zone: { x: 890, y: 220, w: 40, h: 100 }, marker: { x: 912, y: 270, label: 'GROVE' }, to: 'grove', entry: { x: 1030, y: 270 } },
      { type: 'portal', id: 'west-gate', zone: { x: 960, y: 220, w: 50, h: 100 }, marker: { x: 985, y: 270, label: 'VILLAGE' }, to: 'village', entry: { x: 860, y: 270 } },
    ] };
  }
  onEnterArea(to, entry) {
    this.cameras.main.fadeOut(220);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.player.setPosition(entry.x, entry.y);
      this.cameras.main.fadeIn(220);
      this.showMessage(to === 'grove' ? 'Grove reached.' : 'Back in the village.');
      this.transitioning = false;
    });
  }
}

new Phaser.Game({ type: Phaser.AUTO, parent: 'game', width: 960, height: 540, backgroundColor: '#18212d', physics: { default: 'arcade', arcade: { debug: false } }, scene: [BasicTopDownScene] });
