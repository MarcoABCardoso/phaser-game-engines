import { Entity } from '@phaser-game-engines/toolkit/top-down';

export class BattleEncounterEntity extends Entity {
  spawn(scene) {
    if (scene.campaign.snapshot().completedEncounters[this.id]) return;
    this.marker = scene.add.circle(this.spec.x, this.spec.y, 24, 0xef4444).setDepth(5);
    this.label = scene.add.text(this.spec.x, this.spec.y - 42, scene.getEncounter(this.spec.encounter).label, {
      fontFamily: 'sans-serif', fontSize: '15px', color: '#fecaca',
    }).setOrigin(0.5).setDepth(5);
    scene.physics.add.existing(this.marker, true);
    this.overlap = scene.physics.add.overlap(scene.player, this.marker, () => scene.requestEncounter(this));
  }

  destroy() {
    this.overlap?.destroy();
    this.marker?.destroy();
    this.label?.destroy();
  }
}
