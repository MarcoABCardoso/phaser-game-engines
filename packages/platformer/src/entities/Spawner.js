// Spawner.js — an invisible controller entity: when its trigger fires it emits the
// entities in its `spawns` table into the world, each placed via the `place` strategy
// (fixed / random-in-region / scripted list). It has no body of its own — a spawner is
// a rule, not a thing you can see or hit — so it's pure logic and unit-testable. This
// is how enemies/objectives get random or scripted spawn points with no per-spawn
// branch anywhere: the emitted entities join the same generic loops as everything else.
//
// spec = {
//   trigger: { onStart: true }        // once, on the first update
//          | { onEnterZone: rect }     // when the player crosses into rect
//          | { atDangerTier: n }       // when the danger clock reaches tier n
//          | { every: ms },            // on a fixed interval
//   place:   { x, y } | { randomIn: rect } | { points: [...], pick: 'cycle'|'random' },
//   spawns:  [ { type, count?, ...specFields } ],   // what to emit (count defaults to 1)
//   repeat?: boolean,   // re-fire (a zone re-arms when the player leaves; every keeps ticking)
//   limit?:  number,    // hard cap on total entities this spawner will ever emit
//   rng?:    () => number, // injectable for tests; defaults to Math.random
// }
import Entity from './Entity.js';
import { resolveSpawnPoint } from '../systems/spawn.js';
import { createTriggerZone } from '@phaser-game-engines/core';

export default class Spawner extends Entity {
  spawn(scene) {
    this.zoneTrigger = this.spec.trigger?.onEnterZone
      ? createTriggerZone(this.spec.trigger.onEnterZone, { initiallyArmed: true })
      : null;
    this.everyAccum = 0; // for `every` interval accumulation
    this.emitted = 0; // total entities emitted (for `limit` and cycle index)
    this.done = false; // latched once a non-repeat spawner has fired / hit its limit
    this.rng = this.spec.rng ?? scene?.worldRuntime?.rng?.next ?? Math.random;
  }

  update(scene, time, delta) {
    if (this.done) return;
    if (!this.triggerMet(scene, delta)) return;
    this.emit(scene);
    // A one-shot spawner (and any onStart spawner) latches after firing; a repeating
    // one stays live so the trigger can fire again.
    if (!this.spec.repeat || this.spec.trigger.onStart) this.done = true;
  }

  // Pure-ish per-frame decision: has this spawner's trigger condition just occurred?
  // Edge/interval state lives on the instance; the conditions themselves are simple.
  triggerMet(scene, delta) {
    const t = this.spec.trigger || {};
    if (t.onStart) return true;

    if (t.onEnterZone) {
      return this.zoneTrigger.update(scene.player).triggered;
    }

    if (t.atDangerTier !== undefined) {
      return scene.currentDangerTier() >= t.atDangerTier;
    }

    if (t.every !== undefined) {
      this.everyAccum += delta;
      if (this.everyAccum >= t.every) {
        this.everyAccum -= t.every;
        return true;
      }
    }

    return false;
  }

  emit(scene) {
    for (const entry of this.spec.spawns || []) {
      const count = entry.count ?? 1;
      for (let i = 0; i < count; i += 1) {
        if (this.spec.limit !== undefined && this.emitted >= this.spec.limit) {
          this.done = true;
          return;
        }
        // Each emitted entity gets its own placement (so a region varies and a list
        // cycles) and a unique id, then joins the world through the normal path.
        const point = resolveSpawnPoint(this.spec.place, this.rng, this.emitted);
        const { count: _count, ...rest } = entry;
        const spec = { ...rest, id: `${entry.id ?? entry.type}#${this.emitted}`, spawn: point };
        scene.entities.spawnFromSpec(scene, spec);
        this.emitted += 1;
      }
    }
  }
}
