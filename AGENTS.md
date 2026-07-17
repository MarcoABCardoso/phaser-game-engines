# Repository Guide for Agents

## Purpose

This is an npm workspace for small, reusable Phaser 3 game-engine packages. A package must be generic enough for a game to consume without importing game-specific source code. Current packages are:

- `@phaser-game-engines/platformer`
- `@phaser-game-engines/top-down`
- `@phaser-game-engines/turn-based-battle`

The `samples/` directory contains intentionally small Phaser applications that demonstrate consuming each package. It is not a game-content layer.

## Working conventions

- The repository uses ESM JavaScript (`"type": "module"`), Phaser 3, Vite, and Vitest.
- Packages expose their public API from `src/index.js` and maintain subpath exports for intended extension points.
- Keep engine behavior data-driven and extension-oriented: use subclass hooks, registries, providers, or rule adapters rather than imports from a particular game.
- Put deterministic logic in small pure modules and cover it with Vitest. Phaser scenes should adapt input, presentation, and lifecycle to that logic.
- Check `git status --short` before editing. Do not overwrite unrelated user changes.

## Turn-based battle engine: current design

`packages/turn-based-battle` was deliberately refactored away from Final Fantasy-specific combat rules. It is a generic phase/turn state machine, not an HP/MP combat implementation.

`BattleController` owns:

- battle phases: startup, turn start, command selection, resolution, turn end, and finish;
- round queues and the active participant;
- command-submission timing and active-participant checks;
- lifecycle-event order and generic state-patch application.

Games own all domain behavior through a rules adapter:

- `createInitialState(spec)`
- `getTurnOrder(state, context)`
- `getAvailableCommands(state, activeId, context)`
- `resolveCommand(state, command, context)`
- `getOutcome(state, context)`

Optional hooks are `onBattleStart`, `onTurnStart`, `onTurnEnd`, and `validateCommand`. Rule resolution returns a transaction containing a replacement `state`, generic `changes`, and/or domain `events`. The controller publishes lifecycle events such as `turnStarted`, `commandRequested`, `beforeResolve`, `stateChanged`, `afterResolve`, and `battleEnded`.

Do not reintroduce assumptions that participants have `hp`, `mp`, attacks, damage, healing, types, or status effects. Those belong to an adapter or a separate optional rules package. `systems/state.js` only offers generic data patches (`set`, `increment`, `append`, `remove`).

`BattleScene` is an optional Phaser adapter. Subclasses supply rules, menu options, targets, commands, and rendering. The battle sample is an FF-style example of game-owned HP/MP rules, not a prescribed engine model.

## Current objectives and likely next work

- Preserve the generic battle-controller contract while improving its extensibility.
- Add examples/tests for materially different rulesets (for example Pokémon-style PP/types or timing/action-command modifiers) before adding reusable mechanics.
- If a reusable mechanic is proposed, make it an opt-in adapter/helper with no required game-state schema.
- Improve sample presentation only in sample/subclass code; do not move its HP/MP display rules into `BattleScene`.
- Consider documenting event payload schemas and adding tests for event sequence, custom phases, reactions/interrupts, and non-elimination outcomes.

## Verification

Run these after relevant changes:

```bash
npm test
npm run build:battle-sample
```

Other sample commands are listed in the root `package.json`. Vite may report a Phaser bundle-size warning; it is currently expected and not a test failure.

## README vs AGENTS.md

- Keep package READMEs user-facing: installation, public API, schemas, and concise examples.
- Keep this file agent-facing: architectural intent, constraints, implementation history, quality checks, and likely follow-up work.
- When a design becomes stable public behavior, document it in the relevant package README as well; do not rely on this file as public API documentation.
