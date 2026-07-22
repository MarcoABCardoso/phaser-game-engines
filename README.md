# Phaser Game Engines

Reusable foundations for building small Phaser 4 games without importing
game-specific rules into the engine. The workspace separates deterministic,
headless logic from Phaser scenes, physics, input devices, and presentation.

The toolkit is currently prerelease software. See [SUPPORT.md](./SUPPORT.md)
for the compatibility policy and [ROADMAP.md](./ROADMAP.md) for the work toward
a stable developer toolkit.

Browse the [hosted documentation](https://marcoabcardoso.github.io/phaser-game-engines/),
or read the supported entry-point policy in
[docs/PUBLIC_API.md](./docs/PUBLIC_API.md).
New users can start with [the package-selection guide](./docs/CHOOSING_A_PACKAGE.md)
and the [platformer](./docs/tutorials/platformer.md),
[top-down](./docs/tutorials/top-down.md), or
[battle](./docs/tutorials/battle.md) tutorial.
Focused composition examples are collected in
[docs/RECIPES.md](./docs/RECIPES.md), and the save/replay/debug APIs are covered
in [docs/DEVELOPER_TOOLS.md](./docs/DEVELOPER_TOOLS.md).

## Public packages

| Package | Use it for |
| --- | --- |
| `@phaser-game-engines/toolkit` | Core contracts plus platformer, top-down, battle, inventory, and content-tooling subpaths |
| `@phaser-game-engines/create-game` | A minimal JavaScript/TypeScript starter generator for the three genres |

Install the toolkit once, then import only the genre subpaths the game uses. Use
a `/headless` entry point for Node tests, simulations, tools, servers, or a
custom presentation layer:

```js
import { createTraversalController } from '@phaser-game-engines/toolkit/platformer/headless';
import { Battle } from '@phaser-game-engines/toolkit/battle/headless';
import { Inventory } from '@phaser-game-engines/toolkit/inventory/headless';
```

Importing a `/headless` entry point never evaluates Phaser or requires browser
globals. Genre entry points include Phaser adapters and
are intended for browser applications.

## Create a game

Generate a minimal project with a headless logic test:

```bash
npm run create:game -- my-game --genre platformer --language js --package-source .
```

Choose `platformer`, `top-down`, or `battle`, and `js` or `ts`. The local
`--package-source .` option is for workspace development. Developers consuming
the public release use
`npm create @phaser-game-engines/game -- my-game --genre platformer`.

## Develop this workspace

Use Node 20.19 or newer (CI covers Node 20.19, 22, and 24):

```bash
npm ci
npm test
```

Run the complete local verification suite with:

```bash
npm run verify
```

That command checks documented scripts and package metadata, runs unit and type
consumer tests, generates declarations, builds every sample, packs every
package, installs the tarballs into a clean temporary project, and imports each
headless entry point.

## Samples

| Sample | Run | Purpose |
| --- | --- | --- |
| Basic platformer | `npm run dev:platformer` | Platformer scene and traversal |
| Basic top-down | `npm run dev:top-down` | Movement, walls, entities, and portals |
| All-in-one lab | `npm run dev:all-in-one` | Cross-engine scene flow and shared campaign state |
| Basic battle | `npm run dev:battle` | Game-owned HP/MP rules |

Build every sample with `npm run build:samples`. The large-bundle warning from
Vite reflects Phaser's baseline bundle and is currently expected.

Run the searchable documentation site with `npm run dev:docs`, verify its
production bundle with `npm run build:docs`, or use the
[hosted site](https://marcoabcardoso.github.io/phaser-game-engines/).

## Architecture boundary

Engine packages own orchestration: normalized input, deterministic controller
transitions, entity scheduling, lifecycle, cleanup, validation, and Phaser
adaptation. Games own policy: resources, damage, success and failure,
progression, content, and presentation.

Reusable behavior should be optional and composable. A game that does not use
combat, health, inventory, dialogue, or persistence should not carry those
schemas or lifecycle hooks.

## Contributing and releasing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for verification and architecture
expectations. [RELEASING.md](./RELEASING.md) records the prerelease checklist;
releases are staged through GitHub Actions and approved on npm with 2FA.
