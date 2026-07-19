// Portal.js — an invisible trip-zone that LOADS ANOTHER AREA when the player crosses into
// it: the discrete "walk through a door / jump through a gap into the next screen". It's a
// rule like DialogTrigger — no body, no visuals of its own; the gateway the player sees (a
// thin platform at the world's edge, a gap in a floor) is ordinary level geometry, and this
// just watches the zone behind it. Firing hands straight off to the scene's generic
// enterArea(), so which room you land in and where is pure data (`to`, `entry`).
//
// Latched until the player leaves the zone, so arriving right next to a return portal
// doesn't immediately bounce you back through it.
import Entity from './Entity.js';
import { createTriggerZone, validatePortalSpec } from '@phaser-game-engines/toolkit/core';

export default class Portal extends Entity {
  static validateSpec = validatePortalSpec;

  spawn() {
    this.trigger = createTriggerZone(this.spec.zone, { initiallyArmed: true });
  }

  update(scene) {
    if (scene.transitioning) return;
    if (this.trigger.update(scene.player).triggered) {
      scene.enterArea(this.spec.to, this.spec.entry);
    }
  }
}
