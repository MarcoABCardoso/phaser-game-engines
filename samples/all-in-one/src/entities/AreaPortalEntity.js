import { createTriggerZone } from '@phaser-game-engines/toolkit/core';
import { Entity } from '@phaser-game-engines/toolkit/top-down';

export class AreaPortalEntity extends Entity {
  spawn(scene) {
    this.trigger = createTriggerZone(this.spec.zone);
    const x = this.spec.zone.x + this.spec.zone.w / 2;
    const y = this.spec.zone.y + this.spec.zone.h / 2;
    this.marker = scene.add.rectangle(x, y, 24, 80, 0x8b5cf6, 0.65).setDepth(3);
    this.label = scene.add.text(x, y - 50, this.spec.label ?? this.spec.to, {
      fontFamily: 'sans-serif', fontSize: '13px', color: '#ddd6fe',
    }).setOrigin(0.5).setDepth(4);
  }

  update(scene) {
    if (!scene.transitioning && this.trigger.update(scene.player).triggered) {
      scene.enterNamedArea(this.spec.to, this.spec.entryId);
    }
  }

  destroy() {
    this.marker?.destroy();
    this.label?.destroy();
  }
}
