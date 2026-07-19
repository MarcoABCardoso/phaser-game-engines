# @phaser-game-engines/toolkit/core

Small, Phaser-free contracts shared by the genre engines.

The package root and `@phaser-game-engines/toolkit/core/headless` are equivalent; both
are safe to import in Node and browser environments.

`createInputIntent` normalizes movement and action state from any input source.
`selectContextualAction` deterministically chooses the highest-priority available
action, `advanceActionActivation` handles press or hold activation, and
`executeContextualAction` runs an activated action after checking availability
again.

```js
import {
  createInputIntent,
  selectContextualAction,
} from '@phaser-game-engines/toolkit/core';

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

## Device input adapters

`createKeyboardInputAdapter`, `createGamepadInputAdapter`, and
`createTouchInputAdapter` all produce the same intent shape and track
`pressed`/`down`/`released` edges. Keyboard and gamepad bindings can be replaced
at runtime with `setBindings()`, and every adapter exposes game-owned prompt
labels through `getPrompt()` and `intent.meta.prompts`.

```js
const controls = createGamepadInputAdapter({
  bindings: {
    move: { xAxis: 0, yAxis: 1 },
    actions: { jump: [0], dash: [1] },
  },
});

super({ controls });
```

The shared contract is `controls.read(context)` plus optional `reset()`.
Action names are game-owned; adding a binding automatically adds its normalized
`pressed`, `down`, and `released` state to the returned intent.

The touch adapter is presentation-neutral: on-screen controls call
`setMove(x, y)` and `setAction(name, down)`. It does not create DOM or Phaser
objects.

## Assets and animations

`validateAssetManifest` catches duplicate keys and malformed image, atlas,
tilemap, audio, and font entries before loading. `preloadAssetManifest` queues a
validated manifest through a Phaser-compatible loader and converts `loaderror`
events into diagnostics containing the consumer-facing key and URL. Font or
custom loaders are supplied as handlers.

`installAnimationDefinitions` turns explicit frames or atlas frame ranges into
manager definitions. Animation keys remain presentation data and never enter
headless controller state.

Published JSON Schemas live under each package's `schemas/` export. JavaScript
projects can use `defineLevel`, `defineEntity`, and `definePortal` for contextual
TypeScript checking without changing their runtime data.

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

`defineRecipe` groups mechanics and entity types with a stable ID and exclusive
ownership claims. `composeRecipes` rejects conflicts before scene construction.
Recipes may expose named policies so `replaceRecipePolicy` can swap one policy
without copying the rest of the recipe.

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

## Determinism, recording, and debug inspection

`createSeededRng(seed)` returns a serializable Mulberry32 random function;
`createManualClock(time)` provides an explicitly advanced, restorable clock.
Both can be passed directly to headless controllers. `createSessionRecorder`
records normalized input intents, accepted battle commands, and state
checkpoints against an explicit clock. `createReplayViewer` adds pause, step,
speed, and first-divergence reporting.

`captureSessionSnapshot` composes explicitly registered state without walking
Phaser objects. `createSaveStore` uses memory or browser-local-storage adapters
for staged save slots and recovery data. `createSimulationHarness`,
`createBugReportBundle`, and `measureBudget` cover deterministic test,
reporting, and performance loops.

Debug helpers stay presentation-neutral: `createDebugEventLog` captures a
bounded lifecycle trace, while `inspectCapabilities`,
`inspectContextualActions`, and `inspectController` return JSON-friendly data.
`createDebugOverlayMechanic` renders them through a scene text factory and is
fully removable from production configuration.

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
import { lifecycleEvent } from '@phaser-game-engines/toolkit/core';

const stop = scene.lifecycle.on(lifecycleEvent.tick, ({ delta }) => {
  mechanic.update(delta);
});
scene.lifecycle.once(lifecycleEvent.shutdown, stop);
```
