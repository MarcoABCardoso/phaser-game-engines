import Entity from './Entity.js';
import { pointInRect } from '../systems/geometry.js';

export default class Pickup extends Entity {
  spawn(scene) {
    if (this.isGone(scene.save)) return;
    const { x, y, size = 14, color = 0xf6d365 } = this.spec;
    this.sprite = scene.add.rectangle(x, y, size, size, color).setDepth(5);
  }
  update(scene) {
    if (!this.sprite || !pointInRect(scene.player.x, scene.player.y, { x: this.spec.x - 16, y: this.spec.y - 16, w: 32, h: 32 })) return;
    scene.collect(this); this.sprite.destroy(); this.sprite = null;
  }
  destroy() { this.sprite?.destroy(); this.sprite = null; }
}
