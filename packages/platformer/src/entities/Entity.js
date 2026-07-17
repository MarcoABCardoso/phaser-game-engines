// Entity.js — base class for everything instantiated into the world: enemies,
// collectibles, breakables, and whatever v2 adds. The scene keeps a flat list of
// these (see EntityManager) and only ever calls the generic hooks below, so adding
// a new thing — or spawning one mid-run — is "push another Entity," never another
// `if (thisSpecificThing)` branch in the update / attack / reset loops.
//
// Subclasses own their own Phaser objects (created in spawn, torn down in destroy)
// and read whatever they need off the scene passed to each hook.
export default class Entity {
  constructor(spec = {}) {
    this.id = spec.id;
    this.spec = spec;
  }

  // A save flag that, once banked, means this thing is permanently cleared (the boss
  // once defeated, the artifact once recovered). Entities carrying a set goneFlag
  // rebuild straight into their done state. null = always spawns fresh each run.
  get goneFlag() {
    return this.spec.goneFlag ?? null;
  }

  isGone(save) {
    return this.goneFlag ? Boolean(save.flags[this.goneFlag]) : false;
  }

  // --- attackable-surface interface -----------------------------------------
  // The attack loop asks every entity `attackable` + `inAttackRange`, and lands the
  // swing on the first that answers yes — so a breakable wall and a boss share one
  // code path, and a future attackable just implements these three.
  get attackable() {
    return false;
  }

  inAttackRange(/* scene */) {
    return false;
  }

  onHit(/* scene, damage */) {}

  // --- lifecycle ------------------------------------------------------------
  // spawn() builds visuals/bodies for the current save state. update() runs each
  // frame. onBanked() reacts when this entity's goneFlag is banked. destroy() tears
  // everything down (a run reset is just destroy-all + spawn-all from data).
  spawn(/* scene */) {}

  update(/* scene, time, delta */) {}

  onBanked(/* scene */) {}

  destroy(/* scene */) {}
}
