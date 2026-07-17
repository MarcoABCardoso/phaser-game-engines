// EntityManager.js — owns the scene's flat list of world entities and the generic
// loops over them. This is the whole point of the entity refactor: the scene talks
// to `this.entities` in bulk (update-all, find-the-attacked-one, rebuild-all) and
// never names an individual enemy/collectible in its per-frame logic. Spawning one
// more — at build time via a spec, or mid-run via spawn() — needs no new branch.
//
// The manager is constructed with a TYPE REGISTRY (spec.type string -> Entity
// subclass). The engine's generic types live in registry.js; a game passes an
// extended registry so its own entities (e.g. the artifact) are spawnable from data
// without the engine ever importing them.
import { BASE_ENTITY_TYPES } from './registry.js';

export default class EntityManager {
  constructor(types = BASE_ENTITY_TYPES) {
    this.list = [];
    this.types = types;
  }

  createEntity(spec) {
    const Cls = this.types[spec.type];
    if (!Cls) throw new Error(`Unknown entity type: ${spec.type}`);
    return new Cls(spec);
  }

  // Tear everything down and rebuild from the spec list. A run reset is exactly this
  // — no per-entity reset code, and a permanently-cleared thing rebuilds into its
  // done state because each entity reads save flags in its own spawn().
  build(scene, specs) {
    this.destroyAll(scene);
    for (const spec of specs) this.spawn(scene, this.createEntity(spec));
  }

  // Drop a new entity into the live world (e.g. a summoned enemy). It joins every
  // generic loop immediately, with no accompanying `if (thatEnemy)` anywhere.
  spawn(scene, entity) {
    entity.spawn(scene);
    this.list.push(entity);
    return entity;
  }

  // Build one entity from a spec and drop it in — the path a Spawner uses to emit at
  // runtime. Keeps entity construction out of the entities themselves (no import cycle).
  spawnFromSpec(scene, spec) {
    return this.spawn(scene, this.createEntity(spec));
  }

  destroyAll(scene) {
    for (const e of this.list) e.destroy(scene);
    this.list.length = 0;
  }

  update(scene, time, delta) {
    // Iterate a snapshot: a spawner may append new entities this frame (spawnFromSpec),
    // and those shouldn't also update on the same frame they're created.
    for (const e of this.list.slice()) e.update(scene, time, delta);
  }

  // The single place a swing resolves its target: the first attackable surface whose
  // hitbox the player is in reach of. Returns null if the swing hits nothing.
  attackableInReach(scene) {
    for (const e of this.list) {
      if (e.attackable && e.inAttackRange(scene)) return e;
    }
    return null;
  }

  byGoneFlag(flag) {
    return this.list.find((e) => e.goneFlag === flag) || null;
  }

  get(id) {
    return this.list.find((e) => e.id === id) || null;
  }
}
