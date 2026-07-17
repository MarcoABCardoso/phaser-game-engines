import Entity from './Entity.js';
import { pointInRect } from '../systems/geometry.js';

export default class Interactable extends Entity {
  spawn(scene) {
    const { x, y, w = 24, h = 24, color = 0x8a7a4a } = this.spec;
    this.sprite = scene.add.rectangle(x, y, w, h, color).setDepth(4);
  }
  update(scene) {
    if (!pointInRect(scene.player.x, scene.player.y, this.spec.zone, 0)) return;
    scene.nearInteraction = { prompt: this.spec.prompt ?? 'E: interact', entity: this };
    if (scene.wasInteractJustPressed()) scene.interact(this);
  }
  destroy() { this.sprite?.destroy(); }
}
