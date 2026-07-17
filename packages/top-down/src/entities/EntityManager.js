import { BASE_ENTITY_TYPES } from './registry.js';

export default class EntityManager {
  constructor(types = BASE_ENTITY_TYPES) { this.types = types; this.list = []; }
  createEntity(spec) {
    const Type = this.types[spec.type];
    if (!Type) throw new Error(`Unknown entity type: ${spec.type}`);
    return new Type(spec);
  }
  build(scene, specs = []) { this.destroyAll(scene); for (const spec of specs) this.spawn(scene, this.createEntity(spec)); }
  spawn(scene, entity) { entity.spawn(scene); this.list.push(entity); return entity; }
  spawnFromSpec(scene, spec) { return this.spawn(scene, this.createEntity(spec)); }
  update(scene, time, delta) { for (const entity of this.list.slice()) entity.update(scene, time, delta); }
  destroyAll(scene) { for (const entity of this.list) entity.destroy(scene); this.list.length = 0; }
  attackableInReach(scene) { return this.list.find((e) => e.attackable && e.inAttackRange(scene)) ?? null; }
  get(id) { return this.list.find((e) => e.id === id) ?? null; }
}
