import Entity from './Entity.js';
import { createTriggerZone, validatePortalSpec } from '@phaser-game-engines/core';

export default class Portal extends Entity {
  static validateSpec = validatePortalSpec;

  spawn(scene) {
    this.trigger = createTriggerZone(this.spec.zone);
    // Portals are often placed at doors or map edges, but a marker gives an
    // engine-only game a visible, discoverable gateway without custom art.
    const marker = this.spec.marker;
    if (marker) {
      this.marker = scene.add.rectangle(marker.x, marker.y, marker.w ?? 28, marker.h ?? 64, marker.color ?? 0x9b6bdf).setDepth(3);
      this.label = scene.add.text(marker.x, marker.y, marker.label ?? 'EXIT', { fontFamily: 'sans-serif', fontSize: '11px', color: '#ffffff' }).setOrigin(0.5).setDepth(4);
    }
  }
  update(scene) {
    if (!scene.transitioning && this.trigger.update(scene.player).triggered) {
      scene.enterArea(this.spec.to, this.spec.entry);
    }
  }
  destroy() { this.marker?.destroy(); this.label?.destroy(); }
}
