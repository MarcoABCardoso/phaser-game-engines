# @phaser-game-engines/top-down

A reusable Phaser 3 / Arcade Physics top-down engine. Extend `TopDownScene` and provide level data; the engine handles eight-direction movement, solid walls, camera following, entities, interactions, pickups, portals, health, melee combat, and simple chasing enemies.

```js
import { TopDownScene } from '@phaser-game-engines/top-down';

class GameScene extends TopDownScene {
  getLevel() {
    return {
      world: { width: 960, height: 540 },
      spawn: { x: 80, y: 80 },
      walls: [{ x: 0, y: 0, w: 960, h: 24 }],
      entitySpecs: [{ type: 'pickup', id: 'key', item: 'key', x: 220, y: 120 }],
    };
  }
}
```

Built-in entity types are `pickup`, `portal`, `interactable`, `sign`, and `enemy`. A `sign` is an interactable and can use `message: '...'` for an out-of-the-box readable prompt. A portal can use `marker: { x, y, label }` to render a visible gateway. Add game-specific types with `level.entityTypes` or the `entityTypes` scene config. Override `onCollect`, `onInteract`, `onAttack`, `onEnemyDefeated`, `onPlayerDefeated`, and `onEnterArea` to connect game rules and UI. Use `panCameraTo(x, y)` for a short reveal before returning camera follow to the player. `getSave()` can return durable `{ flags, inventory }` state.
