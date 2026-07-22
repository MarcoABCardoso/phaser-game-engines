# @phaser-game-engines/toolkit/top-down

A reusable Phaser 3 / Arcade Physics top-down engine. `TopDownScene` handles
eight-direction movement, solid walls, camera following, generic entities,
contextual interactions, and portals. Health, inventory, persistence, combat,
pickups, and enemies are optional policy.

Use `@phaser-game-engines/toolkit/top-down/headless` for movement and geometry helpers
in Node tests or custom runtimes without evaluating Phaser. The package root
includes the Phaser scene adapter.

```js
import { TopDownScene } from '@phaser-game-engines/toolkit/top-down';

class GameScene extends TopDownScene {
  getLevel() {
    return {
      world: { width: 960, height: 540 },
      spawn: { x: 80, y: 80 },
      walls: [{ x: 0, y: 0, w: 960, h: 24 }],
      entitySpecs: [{
        type: 'interactable', id: 'switch', x: 220, y: 120,
        zone: { x: 190, y: 90, w: 60, h: 60 }, label: 'Use switch',
      }],
    };
  }
}
```

Base entity types are `portal`, `interactable`, and its `sign` alias. An
interactable advertises the `interactable` capability and can use `label` for a
device-independent action label; the older `prompt` field remains supported.
Add game-specific types with `level.entityTypes` or the `entityTypes` scene
config. Use `panCameraTo(x, y)` for a short reveal before camera follow resumes.

## Input intents

The default scene translates keyboard input into a device-independent intent:

```js
{
  move: { x: 0, y: -1 },
  actions: {
    interact: { pressed: false, down: false, released: false },
    primary: { pressed: true, down: true, released: false },
  },
}
```

Pass an adapter with `super({ controls })` to supply the same shape from
keyboard, gamepad, touch, AI, network, or recorded input. A controls adapter
must expose `read(context)` and may expose `reset()`. Movement supports analog
values and is normalized to a unit vector by
`@phaser-game-engines/toolkit/core`. When `controls` is omitted, the compact
base scene retains its built-in Phaser keyboard mapping.

## Contextual actions

Entities can call `scene.offerContextualAction(action)` during their update. The
scene executes the highest-priority available action when the intent's
`interact` action is pressed:

```js
scene.offerContextualAction({
  id: `talk:${this.id}`,
  label: 'Talk',
  priority: 10,
  source: this,
  available: () => npc.isAwake,
  execute: () => scene.startConversation(this.spec.conversationId),
});
```

Equal priorities preserve entity offer order. The selected action is available
as `currentContextualAction` for a HUD.

## Lifecycle events

Each scene exposes a Phaser-free `lifecycle` channel. It publishes `ready` after
the world, player, and entities are built, `tick` after each active world update, and `shutdown` when
Phaser shuts the scene down. Subscribe from composable mechanics without
claiming a subclass hook:

```js
import { lifecycleEvent } from '@phaser-game-engines/toolkit/core';

const stop = scene.lifecycle.on(lifecycleEvent.tick, ({ delta }) => mechanic.update(delta));
scene.lifecycle.once(lifecycleEvent.shutdown, stop);
```

Methods prefixed with `pge` are extension hooks invoked by the toolkit. Methods
without that prefix remain ordinary game-owned helpers or callable scene APIs.
For one game scene's orchestration, override `pgeOnEntitiesBuilt()` to cache
entity handles, `pgeOnReady()` to install presentation, and `pgeOnTick(time, delta)`
to evaluate game-owned rules. These hooks run immediately before their matching
`ready` and `tick` lifecycle events. Entities should expose local state and
resources; the scene should apply whole-stage outcomes such as saving or scene
transitions.

The player is a scene-owned actor, not an entry in the area entity store.
Movement, colliders, and camera follow operate on that persistent Phaser object;
world entities remain area-scoped and can be rebuilt independently.

## Action-adventure recipe

The optional action-adventure recipe restores a small opinionated combination:
health, melee attacks, pickup inventory, save flags, and chasing enemies. Its
state lives at `scene.actionAdventure`, never on the base scene.

```js
import {
  TopDownScene,
  createActionAdventureRecipe,
} from '@phaser-game-engines/toolkit/top-down';

class ActionScene extends TopDownScene {
  constructor() {
    super({
      recipes: [createActionAdventureRecipe({ maxHealth: 6 })],
    });
  }
}
```

Recipe callbacks such as `onAttack`, `onCollect`, `onEnemyDefeated`, and
`onPlayerDefeated` are supplied in the recipe options. The separate
`createExplorationRecipe()` changes movement/status policy without installing
combat or inventory.

## Capabilities and mechanics

Every entity has a capability bag. Entity managers expose
`withCapability(name, predicate)` and `firstWithCapability(...)`. The action
recipe composes `targetable` with `damageReceiver`; games can advertise their
own capabilities without editing `TopDownScene`.

Pass mechanics in the scene config or install them later through
`scene.mechanicHost`. Mechanics are removed automatically on scene shutdown.

## World content and cleanup

`TopDownScene` creates a shared core `worldRuntime` and validates content before
creating physics or display objects. Levels and entities may declare
`schemaVersion: 1`; omitted versions are treated as version 1. Common required
fields are:

```js
{
  schemaVersion: 1,
  world: { width: 960, height: 540 },
  spawn: { x: 80, y: 80 },
  walls: [{ x: 0, y: 0, w: 960, h: 24 }],
  entitySpecs: [{ schemaVersion: 1, type: 'portal', id: 'exit', zone, to: 'grove' }],
}
```

Invalid data throws a `ContentValidationError` with paths such as
`level.walls[0].w` or `level.entitySpecs[0].type`. Entity scheduling, capability
queries, trigger zones, and teardown use the same core contracts as the
platformer package. Scene shutdown empties the entity store even if an earlier
listener or cleanup fails.

Inject clocks, RNG, or snapshot rules with the `worldRuntime` scene option:

```js
super({ worldRuntime: { rng: seededRandom, snapshots: snapshotOptions } });
```
