# Extension recipes

These recipes show the smallest supported seam for common extensions. Keep
game-specific state and presentation in the game.

## Custom entity type

```js
import { Entity } from '@phaser-game-engines/toolkit/top-down';

class Beacon extends Entity {
  spawn(scene) {
    this.sprite = scene.add.circle(this.spec.x, this.spec.y, 8, 0xffdd66);
    this.resources.own(this.sprite);
  }
}

const level = {
  entityTypes: { beacon: Beacon },
  entitySpecs: [{ type: 'beacon', id: 'north', x: 120, y: 80 }],
  // world and spawn omitted here
};
```

The entity owns its Phaser resource through `resources`, so area teardown also
removes the display object.

## Contextual action

```js
scene.offerContextualAction({
  id: `open:${door.id}`,
  label: 'Open door',
  priority: 10,
  available: () => !door.locked,
  execute: () => door.open(),
});
```

Entities advertise actions; the scene's current intent decides activation.

## Mechanic with cleanup

```js
function createScoreMechanic() {
  return scene => {
    const stop = scene.lifecycle.on('tick', ({ delta }) => updateScore(delta));
    return () => stop();
  };
}

scene.mechanicHost.install(createScoreMechanic());
```

Installers return cleanup. They should not claim unrelated scene state.

## Named policy replacement

```js
import { replaceRecipePolicy } from '@phaser-game-engines/toolkit/core';
import { createActionPlatformerRecipe, createHealthMechanic } from '@phaser-game-engines/toolkit/platformer';

const action = createActionPlatformerRecipe();
const customized = replaceRecipePolicy(
  action,
  'health',
  createHealthMechanic({ max: 3, onDepleted: showRetryScreen }),
);
```

Recipes declare exclusive ownership claims. Composition fails immediately when
two recipes own the same policy or register different implementations under the
same entity type.

## Guarded area transition

```js
import { createAreaTransitionController } from '@phaser-game-engines/toolkit/platformer/headless';

const transition = createAreaTransitionController();
if (transition.begin('cave')) {
  await loadArea('cave');
  transition.complete('cave');
}
```

Use `cancel()` when loading fails. The controller prevents overlapping logical
transitions without knowing how a scene fades or loads assets.

## Battle rules adapter

```js
const rules = {
  createInitialState: spec => ({ score: spec.score ?? 0 }),
  getTurnOrder: () => ['player'],
  getAvailableCommands: (_state, actorId) => [{ id: 'score', actorId }],
  resolveCommand: state => ({ state: { score: state.score + 1 } }),
  getOutcome: state => state.score >= 3 ? { kind: 'target-reached' } : null,
};
```

Nothing in this adapter requires combatants, health, or elimination.

## Presentation pacing

```js
// Game rule transaction
return {
  state: nextState,
  effects: [{ type: 'show-result', result }],
};

// Presenter
function onBattleEvent(type, payload) {
  if (type !== 'effectRequested') return;
  animate(payload.effect).then(() => battle.completeEffect());
}
```

The effect is opaque to the controller. Logical resolution remains
deterministic while presentation chooses its own duration.
