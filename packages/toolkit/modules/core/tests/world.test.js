import { describe, expect, it, vi } from 'vitest';
import {
  ContentValidationError,
  EntityStore,
  WorldEntity,
  createEntityRegistry,
  createResourceScope,
  createSnapshotCodec,
  createTriggerZone,
  createWorldRuntime,
  validateLevel,
} from '@phaser-game-engines/toolkit/core';

describe('world registry and entity lifecycle', () => {
  it('constructs registered entities and defers newly spawned updates', () => {
    const updates = [];
    class Child extends WorldEntity { update() { updates.push(this.id); } }
    class Parent extends WorldEntity {
      update(host) {
        updates.push(this.id);
        if (!host.entities.get('child')) host.entities.spawnFromSpec(host, { type: 'child', id: 'child' });
      }
    }
    const entities = new EntityStore({ parent: Parent, child: Child });
    const host = { entities };
    entities.build(host, [{ type: 'parent', id: 'parent' }]);

    entities.update(host, 0, 16);
    expect(updates).toEqual(['parent']);
    entities.update(host, 16, 16);
    expect(updates).toEqual(['parent', 'parent', 'child']);
  });

  it('cleans every entity resource in reverse order and empties after errors', () => {
    const events = [];
    class Owned extends WorldEntity {
      spawn() {
        this.resources.own(() => events.push(`${this.id}:first`));
        this.resources.own(() => events.push(`${this.id}:second`));
      }
      destroy() {
        events.push(`${this.id}:destroy`);
        if (this.id === 'bad') throw new Error('destroy failed');
      }
    }
    const entities = new EntityStore({ owned: Owned });
    entities.build({}, [{ type: 'owned', id: 'good' }, { type: 'owned', id: 'bad' }]);

    expect(() => entities.destroyAll({})).toThrow(AggregateError);
    expect(entities.list).toEqual([]);
    expect(events).toEqual([
      'bad:destroy', 'bad:second', 'bad:first',
      'good:destroy', 'good:second', 'good:first',
    ]);
  });

  it('rolls back entities already spawned when a later spawn fails', () => {
    const cleanup = vi.fn();
    class Stable extends WorldEntity { spawn() { this.resources.own(cleanup); } }
    class Broken extends WorldEntity { spawn() { throw new Error('no body'); } }
    const entities = new EntityStore({ stable: Stable, broken: Broken });

    expect(() => entities.build({}, [{ type: 'stable' }, { type: 'broken' }])).toThrow('no body');
    expect(cleanup).toHaveBeenCalledOnce();
    expect(entities.list).toEqual([]);
  });

  it('supports reversible runtime type registration', () => {
    class First {}
    class Second {}
    const registry = createEntityRegistry({ actor: First });
    const unregister = registry.register('actor', Second);
    expect(registry.get('actor')).toBe(Second);
    expect(unregister()).toBe(true);
    expect(registry.get('actor')).toBe(First);
  });

  it('despawns one entity and its resources by id', () => {
    const cleanup = vi.fn();
    class Owned extends WorldEntity { spawn() { this.resources.own(cleanup); } }
    const entities = new EntityStore({ owned: Owned });
    entities.build({}, [{ type: 'owned', id: 'one' }, { type: 'owned', id: 'two' }]);
    expect(entities.despawn({}, 'one')).toBe(true);
    expect(entities.get('one')).toBeNull();
    expect(entities.get('two')).not.toBeNull();
    expect(cleanup).toHaveBeenCalledOnce();
  });

  it('provides shared spatial queries over game-defined positions', () => {
    const entities = new EntityStore();
    entities.list.push({ id: 'inside', position: { x: 5, y: 5 } });
    entities.list.push({ id: 'outside', position: { x: 50, y: 5 } });
    expect(entities.inRect(
      { x: 0, y: 0, w: 10, h: 10 },
      (entity) => entity.position,
    ).map((entity) => entity.id)).toEqual(['inside']);
  });
});

describe('world queries and dependencies', () => {
  it('edge-triggers zones, then rearms after exit', () => {
    const trigger = createTriggerZone({ x: 0, y: 0, w: 10, h: 10 });
    expect(trigger.update({ x: 5, y: 5 }).triggered).toBe(false);
    expect(trigger.update({ x: 20, y: 5 }).exited).toBe(true);
    expect(trigger.update({ x: 5, y: 5 }).triggered).toBe(true);
    expect(trigger.update({ x: 5, y: 5 }).triggered).toBe(false);
    trigger.update({ x: 20, y: 5 });
    expect(trigger.update({ x: 5, y: 5 }).triggered).toBe(true);
  });

  it('uses explicit clock and RNG dependencies', () => {
    const runtime = createWorldRuntime({ clock: () => 42, rng: () => 0.25 });
    expect(runtime.clock.now()).toBe(42);
    expect(runtime.rng.next()).toBe(0.25);
    expect(() => createWorldRuntime({ rng: () => 1 }).rng.next()).toThrow(RangeError);
  });
});

describe('versioned content and snapshots', () => {
  it('reports the exact path to invalid nested level content', () => {
    expect(() => validateLevel({
      schemaVersion: 1,
      world: { width: 0, height: 100 },
      spawn: { x: 0, y: 0 },
    })).toThrow(new ContentValidationError('level.world.width', 'expected a positive finite number.'));
  });

  it('reports unknown entity types at their array path', () => {
    expect(() => validateLevel({
      world: { width: 100, height: 100 },
      spawn: { x: 0, y: 0 },
      entitySpecs: [{ type: 'missing' }],
    }, { types: createEntityRegistry() })).toThrow('level.entitySpecs[0].type: unknown entity type "missing".');
  });

  it('runs registered entity validators with the full array path', () => {
    class Zoned extends WorldEntity {
      static validateSpec(spec, { path, validateRect }) {
        validateRect(spec.zone, { path: `${path}.zone` });
      }
    }
    expect(() => validateLevel({
      world: { width: 100, height: 100 },
      spawn: { x: 0, y: 0 },
      entitySpecs: [{ type: 'zoned', zone: { x: 0, y: 0, w: -1, h: 4 } }],
    }, { types: createEntityRegistry({ zoned: Zoned }) }))
      .toThrow('level.entitySpecs[0].zone.w: expected a positive finite number.');
  });

  it('migrates snapshot envelopes sequentially before restore', () => {
    const codec = createSnapshotCodec({
      version: 3,
      capture: (source) => ({ score: source.score }),
      migrations: {
        1: (data) => ({ points: data.score }),
        2: (data) => ({ ...data, lives: 3 }),
      },
      restore: (data, target) => Object.assign(target, data),
    });
    expect(codec.serialize({ score: 7 })).toEqual({ version: 3, data: { score: 7 } });
    expect(codec.deserialize({ version: 1, data: { score: 9 } }, {}))
      .toEqual({ points: 9, lives: 3 });
  });

  it('resource scopes are idempotent', () => {
    const scope = createResourceScope();
    const cleanup = vi.fn();
    scope.own(cleanup);
    expect(scope.clear()).toBe(true);
    expect(scope.clear()).toBe(false);
    expect(cleanup).toHaveBeenCalledOnce();
  });
});
