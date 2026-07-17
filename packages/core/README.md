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

## Lifecycle events

`createLifecycle()` provides a synchronous, Phaser-free event channel for
composable mechanics. `on()` returns an unsubscribe function, `once()` installs
a one-shot listener, and `clear()` removes one event's listeners or all of them.
Listeners run in registration order.

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
