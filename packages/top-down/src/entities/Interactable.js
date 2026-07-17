import Entity from './Entity.js';
import { pointInRect } from '../systems/geometry.js';

export default class Interactable extends Entity {
  spawn(scene) {
    const { x, y, w = 24, h = 24, color = 0x8a7a4a } = this.spec;
    this.sprite = scene.add.rectangle(x, y, w, h, color).setDepth(4);
  }
  update(scene) {
    if (!pointInRect(scene.player.x, scene.player.y, this.spec.zone, 0)) return;
    scene.offerContextualAction({
      id: `interact:${this.id}`,
      label: this.spec.label ?? this.spec.prompt ?? 'Interact',
      priority: this.spec.priority ?? 0,
      source: this,
      execute: () => scene.interact(this),
    });
  }
  destroy() { this.sprite?.destroy(); }
}
