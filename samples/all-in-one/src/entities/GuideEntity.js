import Phaser from 'phaser';
import { Entity } from '@phaser-game-engines/toolkit/top-down';

export class GuideEntity extends Entity {
  spawn(scene) {
    this.marker = scene.add.circle(this.spec.x, this.spec.y, 18, 0xa78bfa).setDepth(5);
    this.label = scene.add.text(this.spec.x, this.spec.y - 32, this.spec.label, {
      fontFamily: 'sans-serif', fontSize: '14px', color: '#ede9fe',
    }).setOrigin(0.5).setDepth(5);
  }

  update(scene) {
    if (Phaser.Math.Distance.Between(scene.player.x, scene.player.y, this.spec.x, this.spec.y) > 48) return;
    scene.offerContextualAction({
      id: `talk:${this.id}`,
      label: `Talk to ${this.spec.label}`,
      priority: 20,
      source: this,
      execute: () => scene.talkToGuide(this),
    });
  }

  destroy() {
    this.marker?.destroy();
    this.label?.destroy();
  }
}
