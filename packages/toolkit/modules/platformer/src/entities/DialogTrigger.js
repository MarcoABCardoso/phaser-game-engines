// DialogTrigger.js — an invisible trip-zone that fires a conversation the first time the
// player walks into it. It's how a narrative beat lands on the path itself ("Almost...
// there...") instead of at a sign or an object. No body, no visuals — a rule, like a
// Spawner — so it's cheap and rebuilds fresh each run (fires once per run).
import Entity from './Entity.js';
import { createTriggerZone } from '@phaser-game-engines/toolkit/core';

export default class DialogTrigger extends Entity {
  static validateSpec(spec, { path, validateRect }) {
    validateRect(spec.zone, { path: `${path}.zone` });
  }

  spawn() {
    this.fired = false;
    this.trigger = createTriggerZone(this.spec.zone, { initiallyArmed: true });
  }

  update(scene) {
    if (this.fired || scene.platformerDialogue?.active) return;
    if (this.trigger.update(scene.player).triggered) {
      this.fired = true;
      scene.platformerDialogue?.start(this.spec.dialogId);
    }
  }
}
