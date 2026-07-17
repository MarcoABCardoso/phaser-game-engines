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
