# Phaser Game Engines

A workspace for reusable Phaser game-engine packages. Each package owns its runtime and test contract; games consume an engine package rather than importing its source tree.

## Packages

- `@phaser-game-engines/core` — Phaser-free input and contextual-action contracts shared by genre engines.
- `@phaser-game-engines/platformer` — Phaser 3 / Arcade Physics platformer engine.
- `@phaser-game-engines/top-down` — Phaser 3 / Arcade Physics top-down engine.
- `@phaser-game-engines/turn-based-battle` — generic phase-driven battle state machine with an optional Phaser adapter.

See [ROADMAP.md](./ROADMAP.md) for the mission, architectural direction, and
sequenced implementation milestones.

## Verify

```bash
npm install
npm test
```
## Sample

Run a minimal, engine-only platformer with:

```bash
npm run dev:sample
```

The sample lives in `samples/basic-platformer/` and subclasses `PlatformerScene` without importing any roguelike code.

Run the top-down sample with `npm run dev:top-down-sample`.
