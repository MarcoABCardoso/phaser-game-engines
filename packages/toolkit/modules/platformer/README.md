# @phaser-game-engines/toolkit/platformer

A reusable Phaser 3 platformer engine built on Arcade Physics. The base
`PlatformerScene` provides world adaptation, a data-driven entity loop, floor
and one-way platforms, traversal, portals, contextual actions, and lifecycle
events. It does not activate health, combat, checkpoints, dialogue, persistence,
fall consequences, or run-failure policy.

Use `@phaser-game-engines/toolkit/platformer/headless` in Node tests, simulations, or a
custom renderer. It exports only traversal and area-transition controllers and
does not evaluate Phaser. The package root includes the Phaser scene adapters.

## Use

Extend `PlatformerScene` and supply the world plus game-specific rules through
its hooks and providers:

```js
import { PlatformerScene } from '@phaser-game-engines/toolkit/platformer';

export default class MyGameScene extends PlatformerScene {
  getLevel() { return myLevel; }
  jumpVelocity() { return -460; }
  onJump() { /* game-specific progression */ }
}
```

The required level schema and all extension hooks are documented beside the
corresponding methods in `src/scenes/PlatformerScene.js`. The package has no
game- or content-layer imports; a game may extend `BASE_ENTITY_TYPES` with its
own entities through its level's `entityTypes` map.

Phaser is a peer dependency so the host game owns the Phaser version and
runtime instance.

## Optional mechanics and recipes

Pass mechanics as `new PlatformerScene({ mechanics: [...] })` or use
`scene.mechanicHost.install(mechanic)`. Installers may return cleanup functions;
the scene removes all installed mechanics automatically on shutdown.

`createHealthMechanic`, `createMeleeAttackMechanic`,
`createCheckpointMechanic`, `createDialogueMechanic`, and
`createFailureMechanic` are independent. `createPrecisionPlatformerRecipe()`
provides responsive traversal tuning; `createActionPlatformerRecipe()` composes
the action mechanics and recipe-specific entities. Pass recipes with
`super({ recipes: [...] })`.

Recipes expose named `policies`. Use `replaceRecipePolicy(recipe, name,
replacement)` from core to replace one decision without copying a recipe or
subclassing a scene. Composition rejects duplicate IDs, conflicting entity
registrations, and overlapping ownership claims before resources are created.

## Input intents

The default scene translates keyboard state into the shared, device-independent
`@phaser-game-engines/toolkit/core` intent shape. Override
`readInputIntent(time, delta)` to provide movement and named actions from a
gamepad, touch controls, AI, network input, or replay:

```js
{
  move: { x: 1, y: 0 },
  actions: {
    jump: { pressed: true, down: true },
    primary: { pressed: false, down: false },
    interact: { pressed: false, down: false },
    moveLeft: { pressed: false, down: false },
    moveRight: { pressed: true, down: true },
    down: { pressed: false, down: false },
  },
}
```

`moveLeft` and `moveRight` edges are used for double-tap dash detection. The
other movement behavior reads the normalized `move` vector.

## Contextual actions

Entities and world mechanics call `scene.offerContextualAction(action)` during
their update. Availability and priority determine which nearby action receives
the `interact` input. Actions may activate on a press or a deterministic hold:

```js
scene.offerContextualAction({
  id: `open:${this.id}`,
  label: 'Open gate',
  priority: 10,
  source: this,
  activation: { action: 'interact', mode: 'hold', durationMs: 500 },
  execute: () => this.open(scene),
});
```

The action-platformer recipe's signs and checkpoints use the same priority
system rather than competing to consume a keyboard edge.
`currentContextualAction` exposes the selected action for HUD rendering.

## Lifecycle events

Each scene exposes a Phaser-free `lifecycle` channel. It publishes `ready` after
the existing `onReady` hook, `tick` after each active world update, and
`shutdown` when Phaser shuts the scene down. This lets multiple mechanics
compose without competing for `onReady` or `onTick` overrides:

```js
import { lifecycleEvent } from '@phaser-game-engines/toolkit/core';

const stop = scene.lifecycle.on(lifecycleEvent.tick, ({ delta }) => mechanic.update(delta));
scene.lifecycle.once(lifecycleEvent.shutdown, stop);
```

## Headless traversal controllers

Movement decisions are available without Phaser from
`@phaser-game-engines/toolkit/platformer/controllers`. `createTraversalController()`
composes locomotion, jump resolution, dash, wall traversal, ledge traversal,
and landing detection. The individual factories are exported for games that
want only one ability or use another physics runtime.

```js
import { createTraversalController } from '@phaser-game-engines/toolkit/platformer/controllers';

const traversal = createTraversalController();
traversal.reset(120);
const result = traversal.step({
  time: 1000,
  delta: 16,
  intent,
  body: {
    x: 40, y: 120,
    top: 100, bottom: 140, left: 27, right: 53,
    halfWidth: 13, halfHeight: 20,
    velocityX: 0, velocityY: 0,
    onGround: true, blockedLeft: false, blockedRight: false,
  },
  onOneWay: false,
  solids: [],
  config: {
    maxSpeed: 160, accel: 900, groundDragX: 1400, airDragX: 0,
    jumpVelocity: -420, airJumpCount: 0,
    coyoteMs: 0, jumpBufferMs: 0, fastFallGravity: 0,
    stunUntil: 0, dash: null, wall: null, ledge: null,
  },
});
```

`result.motion` is a declarative body patch containing fields such as
`accelerationX`, `velocityX`, `velocityY`, `dragX`, `gravityY`,
`maxVelocityX`, `allowGravity`, and `reset`. `result.events` reports facts such
as jumps, dashes, sprints, ledge grabs, mantles, and landings. The scene facade
applies the patch to its Arcade body and maps events to the existing hooks.

Landing events contain `{ drop, impactVelocity }`; the controller never assigns
damage or health semantics. The base scene applies no consequence. A game can
implement `onLanding(fact)`, install `createLandingConsequenceMechanic`, or
observe the `landing` event without carrying HP state.

`createAreaTransitionController()` separately provides a deterministic
`begin`/`complete`/`cancel` guard for asynchronous area changes.

## World content and cleanup

`PlatformerScene` creates the same core `worldRuntime` used by `TopDownScene`.
It validates the world size, spawn, floor segments, platforms, entity types, and
registered entity-specific fields before constructing the area. Levels and
entities may declare `schemaVersion: 1`; omitted versions remain compatible and
mean version 1.

Invalid content fails with its exact path, including area identifiers during a
transition, for example `level("tower").platforms[3].h`. A failed next-area
validation leaves the current area intact.

The shared entity store owns deterministic update order and teardown. Every
entity inherits a `resources` scope for listeners, timers, bodies, and similar
handles. Area teardown and scene shutdown empty the store and run all resource
cleanups even when another cleanup throws. The shared portal/trigger-zone
contract also prevents arrival zones from immediately bouncing a player back.

Explicit runtime dependencies can be supplied without coupling movement to
them:

```js
super({
  worldRuntime: {
    clock: () => simulation.now,
    rng: () => simulation.random(),
    snapshots: snapshotOptions,
  },
});
```
