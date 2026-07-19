# @phaser-game-engines/toolkit/content

Validate JSON level files in Node and CI using the same headless validators as
the runtime scenes:

```bash
pge-content validate levels/village.json --kind top-down
pge-content validate levels/cave.json --kind platformer --types customDoor
pge-content validate config/action-adventure.json --kind action-adventure
pge-content validate assets/manifest.json --kind assets
```

Errors include the source filename and exact property path. `--types` registers
game-owned entity type names for common-schema validation without importing game
code.

Normalize explicit version markers with a safe preview:

```bash
pge-content migrate levels/village.json
pge-content migrate levels/village.json --write
```

The first command prints the proposed JSON and never writes. The second updates
the explicitly named file.

## Tiled adapter

Import `@phaser-game-engines/toolkit/content/tiled` in an authoring build or game.
The adapter reads only Tiled object layers assigned the roles `spawn`, `solids`,
`platforms`, and `entities`. A layer may use that name or set an `engineRole`
custom property. Entity objects use their Tiled class/type and custom properties.
The converted plain object is validated by the same genre contract used at
runtime; Tiled itself is never a runtime dependency.

## Vite validation

`createContentValidationPlugin` from
`@phaser-game-engines/toolkit/content/vite` validates configured files on build
and again before their hot update is applied. Errors retain the filename and
exact property path, so the Vite overlay points back to authored content.
