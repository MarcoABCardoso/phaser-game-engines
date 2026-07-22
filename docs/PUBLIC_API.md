# Public API policy

The `exports` map in each public package manifest is the authoritative module
boundary. Files that cannot be reached through those maps are implementation
details and may change without a migration path.

## Entry-point categories

### Toolkit subpaths

The toolkit root and `/core` are completely headless. The `/platformer`,
`/top-down`, `/battle`, and `/inventory` subpaths export optional Phaser scene adapters and
therefore evaluate Phaser.

### Headless entry points

Every runtime area has an explicit headless entry point that is safe in Node and
does not evaluate Phaser:

- `@phaser-game-engines/toolkit/core/headless`
- `@phaser-game-engines/toolkit/platformer/headless`
- `@phaser-game-engines/toolkit/top-down/headless`
- `@phaser-game-engines/toolkit/battle/headless`
- `@phaser-game-engines/toolkit/inventory/headless`

They are the preferred imports for tests, simulations, developer tools, custom
renderers, and server-side rule evaluation.

### Extension subpaths

Documented `controllers`, `entities`, `mechanics`, `recipes`, `scenes`, and
`systems` subpaths are supported extension points. They expose smaller pieces
for games that do not want a genre root. New code should use a genre or
`/headless` import when it provides the required API; subpaths are intended for
deliberate composition.

## Stability before 1.0

All exported APIs are supported, but the toolkit remains prerelease. A minor
release may change an export, TypeScript type, lifecycle payload, content schema,
snapshot, or recipe behavior. Such changes require a changelog entry and a
migration example.

The project is early and does not retain prototype compatibility facades.
Before `1.0`, a minor version may remove an obsolete design when the changelog
documents the replacement. Base scenes intentionally contain no inactive
combat, dialogue, health, inventory, or menu policy.

## Type declarations

Core, platformer, and top-down declarations are generated from their ESM source.
The battle and inventory roots have curated generic declaration surfaces, while their individual
subpaths also receive generated declarations. CI compiles a strict external
consumer fixture and verifies that every exported runtime subpath has a matching
declaration target.
