# Phaser Game Engines

Reusable foundations for building small Phaser 3 games without importing
game-specific rules into the engine. The workspace separates deterministic,
headless logic from Phaser scenes, physics, input devices, and presentation.

The packages are currently prerelease software. See [SUPPORT.md](./SUPPORT.md)
for the compatibility policy and [ROADMAP.md](./ROADMAP.md) for the work toward
a stable developer toolkit.

The supported entry-point policy is documented in
[docs/PUBLIC_API.md](./docs/PUBLIC_API.md).
New users can start with [the package-selection guide](./docs/CHOOSING_A_PACKAGE.md)
and the [platformer](./docs/tutorials/platformer.md),
[top-down](./docs/tutorials/top-down.md), or
[battle](./docs/tutorials/battle.md) tutorial.
Focused composition examples are collected in
[docs/RECIPES.md](./docs/RECIPES.md), and the save/replay/debug APIs are covered
in [docs/DEVELOPER_TOOLS.md](./docs/DEVELOPER_TOOLS.md).

## Packages

| Package | Use it for |
| --- | --- |
| `@phaser-game-engines/core` | Input, recipes, lifecycle, world contracts, saves, replay, testing, and debug tools |
| `@phaser-game-engines/platformer` | Arcade platformer scenes, headless traversal, and precision/action recipes |
| `@phaser-game-engines/top-down` | Top-down scenes, interactions, portals, and exploration/action recipes |
| `@phaser-game-engines/turn-based-battle` | A schema-free turn state machine and optional accessible presentation recipe |
| `@phaser-game-engines/create-game` | A minimal JavaScript/TypeScript starter generator for the three genres |
| `@phaser-game-engines/content-tools` | Offline JSON level validation and safe content migration previews |

Use a genre package when its Phaser scene is a useful starting point. Use its
`/headless` entry point for Node tests, simulations, tools, servers, or a custom
presentation layer:

```js
import { createTraversalController } from '@phaser-game-engines/platformer/headless';
import { Battle } from '@phaser-game-engines/turn-based-battle/headless';
```

Importing a `/headless` entry point never evaluates Phaser or requires browser
globals. Package root entry points for genre engines include Phaser adapters and
are intended for browser applications.

## Create a game

Generate a minimal project with a headless logic test:

```bash
npm run create:game -- my-game --genre platformer --language js --package-source .
```

Choose `platformer`, `top-down`, or `battle`, and `js` or `ts`. The local
`--package-source .` option is for workspace development; after the packages are
published, the standalone generator will use released package versions.

## Develop this workspace

Use Node 22 or 24:

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
| Non-combat top-down | `npm run dev:top-down-non-combat` | Contextual actions without health or combat |
| Basic battle | `npm run dev:battle` | Game-owned HP/MP rules |
| PP battle | `npm run dev:battle-pp` | A different PP/type state schema |
| Negotiation battle | `npm run dev:battle-negotiation` | A non-elimination outcome |

Build every sample with `npm run build:samples`. The large-bundle warning from
Vite reflects Phaser's baseline bundle and is currently expected.

Run the searchable documentation site with `npm run dev:docs`, or verify its
production bundle with `npm run build:docs`.

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
public npm publishing remains intentionally blocked until the repository owner
selects a license and configures the npm scope.
