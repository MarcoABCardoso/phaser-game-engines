# Public API policy

The `exports` map in each package manifest is the authoritative public module
boundary. Files that cannot be reached through that map are implementation
details and may change without a migration path.

## Entry-point categories

### Package roots

The package root is the normal browser entry point. The core root is completely
headless. The platformer, top-down, and turn-based-battle roots also export
optional Phaser scene adapters and therefore evaluate Phaser.

### Headless entry points

Every package supports `/headless`. These entry points are safe in Node and do
not evaluate Phaser:

- `@phaser-game-engines/core/headless`
- `@phaser-game-engines/platformer/headless`
- `@phaser-game-engines/top-down/headless`
- `@phaser-game-engines/turn-based-battle/headless`

They are the preferred imports for tests, simulations, developer tools, custom
renderers, and server-side rule evaluation.

### Extension subpaths

Documented `controllers`, `entities`, `mechanics`, `recipes`, `scenes`, and
`systems` subpaths are supported extension points. They expose smaller pieces
for games that do not want a package root. New code should use a root or
`/headless` import when it provides the required API; subpaths are intended for
deliberate composition.

## Stability before 1.0

All exported APIs are supported, but the packages remain prerelease. A minor
release may change an export, TypeScript type, lifecycle payload, content schema,
snapshot, or recipe behavior. Such changes require a changelog entry and a
migration example.

The project is early and does not retain prototype compatibility facades.
Before `1.0`, a minor version may remove an obsolete design when the changelog
documents the replacement. Base scenes intentionally contain no inactive
combat, dialogue, health, inventory, or menu policy.

## Type declarations

Core, platformer, and top-down declarations are generated from their ESM source.
The battle root has a curated generic declaration surface, while its individual
subpaths also receive generated declarations. CI compiles a strict external
consumer fixture and verifies that every exported runtime subpath has a matching
declaration target.
