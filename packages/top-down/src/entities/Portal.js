import Entity from './Entity.js';
import { pointInRect } from '../systems/geometry.js';

export default class Portal extends Entity {
  spawn(scene) {
    this.armed = false;
    // Portals are often placed at doors or map edges, but a marker gives an
    // engine-only game a visible, discoverable gateway without custom art.
    const marker = this.spec.marker;
    if (marker) {
      this.marker = scene.add.rectangle(marker.x, marker.y, marker.w ?? 28, marker.h ?? 64, marker.color ?? 0x9b6bdf).setDepth(3);
      this.label = scene.add.text(marker.x, marker.y, marker.label ?? 'EXIT', { fontFamily: 'sans-serif', fontSize: '11px', color: '#ffffff' }).setOrigin(0.5).setDepth(4);
    }
  }
  update(scene) {
    const inside = pointInRect(scene.player.x, scene.player.y, this.spec.zone);
    if (!inside) this.armed = true;
    else if (this.armed && !scene.transitioning) { this.armed = false; scene.enterArea(this.spec.to, this.spec.entry); }
  }
  destroy() { this.marker?.destroy(); this.label?.destroy(); }
}
