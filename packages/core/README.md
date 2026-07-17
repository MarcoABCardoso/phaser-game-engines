# @phaser-game-engines/core

Small, Phaser-free contracts shared by the genre engines.

`createInputIntent` normalizes movement and action state from any input source.
`selectContextualAction` deterministically chooses the highest-priority available
action, `advanceActionActivation` handles press or hold activation, and
`executeContextualAction` runs an activated action after checking availability
again.

```js
import {
  createInputIntent,
  selectContextualAction,
} from '@phaser-game-engines/core';

const intent = createInputIntent({
  move: { x: 1, y: 0 },
  actions: { interact: { pressed: true, down: true } },
});

const action = selectContextualAction([
  { id: 'read', label: 'Read', priority: 10, execute: () => {} },
]);
```

Input adapters decide how keyboard, gamepad, touch, AI, or replay data produces
the intent. Games and entities decide what contextual actions mean.

## Capabilities and mechanics

`createCapabilities()` is a schema-free bag for named entity abilities. Values
may be functions, adapter objects, or data. `getCapability()` and
`hasCapability()` also accept plain capability objects, so games can define new
capabilities without changing a genre scene.

`createMechanicHost(host)` installs opt-in mechanics. A mechanic is an install
function (or an object with `install`) that may return a cleanup function.
Duplicate installation is ignored; removal is idempotent; `clear()` removes all
mechanics in reverse installation order.

```js
const stopDamage = entity.capabilities.provide('damageReceiver', {
  receive: ({ amount }) => health.lose(amount),
});

const mechanics = createMechanicHost(scene);
mechanics.install((host) => host.lifecycle.on('tick', updateQuest));
```

## World runtime

`createWorldRuntime()` composes the shared, Phaser-free contracts used by both
real-time engines:

- a reversible entity-type registry;
- deterministic entity construction, snapshot iteration, capability queries,
  and teardown through `EntityStore`;
- edge-triggered rectangular zones through `createTriggerZone`;
- explicit `{ now() }` clock and `{ next() }` RNG dependencies;
- a versioned snapshot codec.

`WorldEntity` gives every entity a capability bag and a `resources` scope.
Entities should own listeners, timers, bodies, or other external handles through
`resources.own(...)`. Teardown runs entity `destroy()` methods and resource
cleanups in reverse order, continues after failures, and reports failures as an
`AggregateError` only after every entity has been visited.

```js
class Sensor extends WorldEntity {
  spawn(scene) {
    this.resources.own(scene.lifecycle.on('tick', () => this.scan(scene)));
  }
}

const runtime = createWorldRuntime({
  types: { sensor: Sensor },
  clock: () => scene.time.now,
  rng: () => replay.nextRandom(),
});
```

## Versioned content and snapshots

Levels and entity specs use `schemaVersion: 1`; omitting it is accepted as
version 1 for existing content. `validateLevel()` checks the common world,
spawn, and entity fields before Phaser resources are created. Registered entity
classes may expose `static validateSpec(spec, context)` for type-specific
validation. Errors include the exact content path, for example:

```text
level.entitySpecs[2].zone.w: expected a positive finite number.
```

`createSnapshotCodec({ version, capture, restore, migrations })` wraps data in
`{ version, data }` and applies every sequential migration before restore. It
defines serialization boundaries without prescribing a game-state schema.

## Lifecycle events

`createLifecycle()` provides a synchronous, Phaser-free event channel for
composable mechanics. `on()` returns an unsubscribe function, `once()` installs
a one-shot listener, and `clear()` removes one event's listeners or all of them.
Listeners run in registration order. If a listener throws, later listeners still
run; failures are reported together as an `AggregateError`.

The real-time scene adapters expose a `scene.lifecycle` channel and publish the
shared `lifecycleEvent.ready`, `lifecycleEvent.tick`, and
`lifecycleEvent.shutdown` events. Their payloads are `{ scene }`,
`{ scene, time, delta }`, and `{ scene }`, respectively.

```js
import { lifecycleEvent } from '@phaser-game-engines/core';

const stop = scene.lifecycle.on(lifecycleEvent.tick, ({ delta }) => {
  mechanic.update(delta);
});
scene.lifecycle.once(lifecycleEvent.shutdown, stop);
```
