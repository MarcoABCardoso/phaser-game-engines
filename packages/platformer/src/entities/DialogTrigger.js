// DialogTrigger.js — an invisible trip-zone that fires a conversation the first time the
// player walks into it. It's how a narrative beat lands on the path itself ("Almost...
// there...") instead of at a sign or an object. No body, no visuals — a rule, like a
// Spawner — so it's cheap and rebuilds fresh each run (fires once per run).
import Entity from './Entity.js';
import { pointInRect } from '../systems/geometry.js';

export default class DialogTrigger extends Entity {
  spawn() {
    this.fired = false;
  }

  update(scene) {
    if (this.fired || scene.dialogActive) return;
    if (pointInRect(scene.player.x, scene.player.y, this.spec.zone)) {
      this.fired = true;
      scene.startDialog(this.spec.dialogId);
    }
  }
}
