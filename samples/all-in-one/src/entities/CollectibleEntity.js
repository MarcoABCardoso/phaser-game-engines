import Phaser from 'phaser';
import { Entity } from '@phaser-game-engines/toolkit/top-down';
import { createItem } from '../content/items.js';
import { audioDirector } from '../presentation/audio-director.js';

export class CollectibleEntity extends Entity {
  spawn(scene) {
    if (scene.campaign.hasCollected(this.id, scene.areaId)) return;
    this.marker = scene.add.circle(this.spec.x, this.spec.y, 13, this.spec.color ?? 0xfacc15).setDepth(5);
    this.label = scene.add.text(this.spec.x, this.spec.y - 25, this.spec.label, {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#fef3c7',
    }).setOrigin(0.5).setDepth(5);
  }

  update(scene) {
    if (!this.marker) return;
    if (Phaser.Math.Distance.Between(scene.player.x, scene.player.y, this.spec.x, this.spec.y) > 28) return;
    const added = scene.campaign.collect(this.id, createItem(this.spec.item, this.id), { areaId: scene.areaId });
    if (!added) {
      scene.showMessage('Inventory full — open it with I and make space.');
      return;
    }
    scene.showMessage(`${this.spec.label} added to inventory.`);
    audioDirector.cue('collect', { enabled: scene.campaign.snapshot().settings.audio });
    scene.entities.despawn(scene, this);
  }

  destroy() {
    this.marker?.destroy();
    this.label?.destroy();
    this.marker = null;
    this.label = null;
  }
}
