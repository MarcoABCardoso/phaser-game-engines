# @phaser-game-engines/platformer

A reusable Phaser 3 platformer engine built on Arcade Physics. It provides a
subclassable `PlatformerScene`, a data-driven entity loop, floor and one-way
platforms, movement options, attacks, health, checkpoints, dialogue, portals,
and spawn controllers.

## Use

Extend `PlatformerScene` and supply the world plus game-specific rules through
its hooks and providers:

```js
import { PlatformerScene } from '@phaser-game-engines/platformer';

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

## Input intents

The default scene translates keyboard state into the shared, device-independent
`@phaser-game-engines/core` intent shape. Override
`readInputIntent(time, delta)` to provide movement and named actions from a
gamepad, touch controls, AI, network input, or replay:

```js
{
  move: { x: 1, y: 0 },
  actions: {
    jump: { pressed: true, down: true },
    primary: { pressed: false, down: false },
    interact: { pressed: false, down: false },
    abandon: { pressed: false, down: false },
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

Built-in signs now offer press actions. Unlit checkpoints offer a press action;
lit checkpoints offer a hold-to-rest action, so overlapping interactions resolve
through one priority system rather than competing to consume the keyboard edge.
`currentContextualAction` exposes the selected action for HUD rendering.
