import { createCapabilities, getCapability, hasCapability } from './capabilities.js';
import { entitiesInRect, pointInRect } from './geometry.js';
import { createResourceScope } from './resources.js';
import { validateEntitySpec, validateLevel } from './schema.js';
import { createSnapshotCodec } from './serialization.js';

export function createEntityRegistry(initial = {}) {
  const types = new Map();

  function register(name, EntityType) {
    if (typeof name !== 'string' || !name) throw new TypeError('Entity type name must be a non-empty string.');
    if (typeof EntityType !== 'function') throw new TypeError(`Entity type ${JSON.stringify(name)} must be a constructor.`);
    const previous = types.get(name);
    types.set(name, EntityType);
    return () => {
      if (types.get(name) !== EntityType) return false;
      if (previous) types.set(name, previous);
      else types.delete(name);
      return true;
    };
  }

  for (const [name, EntityType] of Object.entries(initial ?? {})) register(name, EntityType);
  return Object.freeze({
    register,
    has: (name) => types.has(name),
    get: (name) => types.get(name),
    entries: () => [...types.entries()],
    toObject: () => Object.fromEntries(types),
  });
}

/** Shared headless entity state; Phaser objects remain owned by genre subclasses. */
export class WorldEntity {
  constructor(spec = {}) {
    this.id = spec.id;
    this.spec = spec;
    this.capabilities = createCapabilities(spec.capabilities);
    this.resources = createResourceScope();
  }

  get goneFlag() { return this.spec.goneFlag ?? null; }
  isGone(save) { return this.goneFlag ? Boolean(save?.flags?.[this.goneFlag]) : false; }
  spawn() {}
  update() {}
  destroy() {}
}

/** Shared deterministic construction, scheduling, querying, and teardown. */
export class EntityStore {
  constructor(types = {}) {
    this.registry = types?.get && types?.register ? types : createEntityRegistry(types);
    Object.defineProperty(this, 'types', { enumerable: true, get: () => this.registry.toObject() });
    this.list = [];
  }

  createEntity(spec, path = 'entity') {
    validateEntitySpec(spec, { path, types: this.registry });
    const EntityType = this.registry.get(spec.type);
    return new EntityType(spec);
  }

  build(host, specs = []) {
    this.destroyAll(host);
    try {
      specs.forEach((spec, index) => this.spawn(host, this.createEntity(spec, `entitySpecs[${index}]`)));
    } catch (error) {
      try { this.destroyAll(host); } catch (cleanupError) {
        throw new AggregateError([error, cleanupError], 'Entity build and rollback both failed.');
      }
      throw error;
    }
  }

  spawn(host, entity) {
    if (!entity || typeof entity.spawn !== 'function') throw new TypeError('A world entity must expose spawn(host).');
    try {
      entity.spawn(host);
      this.list.push(entity);
      return entity;
    } catch (error) {
      try { entity.resources?.clear?.(); } catch (cleanupError) {
        throw new AggregateError([error, cleanupError], 'Entity spawn and cleanup both failed.');
      }
      throw error;
    }
  }

  spawnFromSpec(host, spec) { return this.spawn(host, this.createEntity(spec)); }

  update(host, time, delta) {
    for (const entity of this.list.slice()) entity.update(host, time, delta);
  }

  despawn(host, entityOrId) {
    const index = typeof entityOrId === 'string'
      ? this.list.findIndex((entity) => entity.id === entityOrId)
      : this.list.indexOf(entityOrId);
    if (index === -1) return false;
    const [entity] = this.list.splice(index, 1);
    const errors = [];
    try { entity.destroy(host); } catch (error) { errors.push(error); }
    try { entity.resources?.clear?.(); } catch (error) { errors.push(error); }
    if (errors.length) throw new AggregateError(errors, `Entity ${JSON.stringify(entity.id)} failed to tear down.`);
    return true;
  }

  destroyAll(host) {
    const errors = [];
    for (const entity of this.list.slice().reverse()) {
      try { entity.destroy(host); } catch (error) { errors.push(error); }
      try { entity.resources?.clear?.(); } catch (error) { errors.push(error); }
    }
    this.list.length = 0;
    if (errors.length) throw new AggregateError(errors, 'One or more entities failed to tear down.');
  }

  withCapability(name, predicate = null) {
    return this.list.filter((entity) => hasCapability(entity, name)
      && (!predicate || predicate(getCapability(entity, name), entity)));
  }

  firstWithCapability(name, predicate = null) {
    return this.withCapability(name, predicate)[0] ?? null;
  }

  get(id) { return this.list.find((entity) => entity.id === id) ?? null; }
  byGoneFlag(flag) { return this.list.find((entity) => entity.goneFlag === flag) ?? null; }
  query(predicate) { return this.list.filter(predicate); }
  inRect(rect, getPoint) { return entitiesInRect(this.list, rect, getPoint); }
}

/** Edge-triggered zone state shared by portals and other trigger volumes. */
export function createTriggerZone(zone, { initiallyArmed = false } = {}) {
  let armed = initiallyArmed;
  let wasInside = false;
  return Object.freeze({
    update(point) {
      const inside = pointInRect(point.x, point.y, zone);
      const entered = inside && !wasInside;
      const exited = !inside && wasInside;
      if (!inside) armed = true;
      const triggered = inside && armed && entered;
      if (triggered) armed = false;
      wasInside = inside;
      return { inside, entered, exited, triggered };
    },
    reset(nextArmed = initiallyArmed) { armed = nextArmed; wasInside = false; },
    get armed() { return armed; },
  });
}

function normalizeClock(clock) {
  if (!clock) return Object.freeze({ now: () => Date.now() });
  if (typeof clock === 'function') return Object.freeze({ now: clock });
  if (typeof clock.now !== 'function') throw new TypeError('World clock must expose now().');
  return clock;
}

function normalizeRng(rng) {
  const next = typeof rng === 'function' ? rng : rng?.next?.bind(rng);
  if (!next) return Object.freeze({ next: Math.random });
  const source = rng;
  const adapter = { next() {
      const value = next();
      if (!Number.isFinite(value) || value < 0 || value >= 1) throw new RangeError('World RNG must return a value in [0, 1).');
      return value;
    } };
  if (typeof source?.getState === 'function') adapter.getState = () => source.getState();
  if (typeof source?.setState === 'function') adapter.setState = (state) => source.setState(state);
  return Object.freeze(adapter);
}

export function createWorldRuntime({
  types = {}, EntityStoreType = EntityStore, clock, rng, snapshots,
} = {}) {
  const registry = types?.get && types?.register ? types : createEntityRegistry(types);
  const entities = new EntityStoreType(registry);
  return Object.freeze({
    registry,
    entities,
    clock: normalizeClock(clock),
    rng: normalizeRng(rng),
    snapshots: createSnapshotCodec(snapshots),
    validateLevel: (level, options = {}) => validateLevel(level, { ...options, types: registry }),
  });
}
