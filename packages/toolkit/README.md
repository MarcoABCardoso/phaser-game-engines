# @phaser-game-engines/toolkit

Composable foundations for small Phaser 3 games. Install one package and import
only the genre and runtime surfaces the game uses.

```bash
npm install @phaser-game-engines/toolkit phaser
```

```js
import { createInputIntent } from '@phaser-game-engines/toolkit/core';
import { PlatformerScene } from '@phaser-game-engines/toolkit/platformer';
import { Battle } from '@phaser-game-engines/toolkit/battle/headless';
import { Inventory } from '@phaser-game-engines/toolkit/inventory/headless';
```

Public subpaths are grouped under `core`, `platformer`, `top-down`, `battle`,
`inventory`, and `content`. Headless imports do not evaluate Phaser. The `pge-content` binary
provides offline content validation and migration.

See the [versioned documentation](https://marcoabcardoso.github.io/phaser-game-engines/)
for package selection, tutorials, schemas, recipes, and the complete public API
policy.
