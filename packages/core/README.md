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
