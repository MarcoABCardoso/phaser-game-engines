import Phaser from 'phaser';
import { lifecycleEvent } from '@phaser-game-engines/core';
import { TopDownScene } from '@phaser-game-engines/top-down';

const SPECIMEN_COUNT = 4;

function installSurveyHud(scene) {
  let progress;
  const subscriptions = [
    scene.lifecycle.on(lifecycleEvent.ready, () => {
      progress = scene.add.text(12, 510, '', {
        fontFamily: 'sans-serif',
        fontSize: '16px',
        color: '#dff7c6',
        backgroundColor: '#14261ecc',
        padding: { x: 7, y: 4 },
      }).setScrollFactor(0).setDepth(100);
    }),
    scene.lifecycle.on(lifecycleEvent.tick, () => {
      progress?.setText(`Field notes: ${scene.save.observations.size}/${SPECIMEN_COUNT}`);
    }),
  ];
  scene.lifecycle.once(lifecycleEvent.shutdown, () => {
    for (const unsubscribe of subscriptions) unsubscribe();
  });
}

class BotanicalSurveyScene extends TopDownScene {
  constructor() {
    super({ key: 'botanical-survey' });
    installSurveyHud(this);
  }

  combatEnabled() { return false; }
  getSave() { return { flags: {}, observations: new Set() }; }

  getLevel() {
    return {
      world: { width: 960, height: 540 },
      spawn: { x: 92, y: 270 },
      walls: [
        { x: 0, y: 0, w: 960, h: 24, color: 0x294c3b },
        { x: 0, y: 516, w: 960, h: 24, color: 0x294c3b },
        { x: 0, y: 0, w: 24, h: 540, color: 0x294c3b },
        { x: 936, y: 0, w: 24, h: 540, color: 0x294c3b },
        { x: 210, y: 105, w: 170, h: 52, color: 0x315b43 },
        { x: 580, y: 90, w: 180, h: 58, color: 0x315b43 },
        { x: 300, y: 370, w: 190, h: 58, color: 0x315b43 },
        { x: 680, y: 350, w: 150, h: 62, color: 0x315b43 },
      ],
      entitySpecs: [
        {
          type: 'interactable', id: 'moon-orchid', x: 180, y: 190,
          color: 0xc7ddff, label: 'Observe moon orchid',
          zone: { x: 145, y: 160, w: 70, h: 70 },
          message: 'Moon orchid: its pale petals turn toward shaded water.',
        },
        {
          type: 'interactable', id: 'copper-fern', x: 520, y: 175,
          color: 0xd79a61, label: 'Observe copper fern',
          zone: { x: 485, y: 140, w: 70, h: 70 },
          message: 'Copper fern: new fronds carry a warm metallic sheen.',
        },
        {
          type: 'interactable', id: 'star-moss', x: 250, y: 335,
          color: 0x8ed081, label: 'Observe star moss',
          zone: { x: 215, y: 300, w: 70, h: 70 },
          message: 'Star moss: each rosette stores a bright bead of rain.',
        },
        {
          type: 'interactable', id: 'bell-vine', x: 650, y: 300,
          color: 0xb99be6, label: 'Observe bell vine',
          zone: { x: 615, y: 265, w: 70, h: 70 },
          message: 'Bell vine: hollow flowers hum softly when the wind changes.',
        },
      ],
    };
  }

  onInteract(entity) {
    if (this.save.observations.has(entity.id)) return;
    this.save.observations.add(entity.id);
    entity.sprite?.setStrokeStyle(3, 0xf2ffd8);
    if (this.save.observations.size === SPECIMEN_COUNT) {
      this.showMessage('Survey complete: four distinct adaptations recorded.', 4000);
    }
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 960,
  height: 540,
  backgroundColor: '#1d3429',
  physics: { default: 'arcade', arcade: { debug: false } },
  scene: [BotanicalSurveyScene],
});
