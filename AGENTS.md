# Repository Guide for Agents

## Purpose

This is an npm workspace for small, reusable Phaser 3 game-engine packages. A package must be generic enough for a game to consume without importing game-specific source code. Current packages are:

- `@phaser-game-engines/platformer`
- `@phaser-game-engines/top-down`
- `@phaser-game-engines/turn-based-battle`

Developer tooling also includes `@phaser-game-engines/create-game`, a small
project generator, and `@phaser-game-engines/content-tools`, the headless
validation/migration CLI. They are not runtime engine packages.

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

`BattleScene` is an optional Phaser lifecycle adapter and carries no menu policy.
`createBattlePresentationRecipe` owns keyboard/gamepad menus, target selection,
and pacing. Subclasses or recipe callbacks supply choices, commands, and
rendering. The battle sample's HP/MP rules remain game-owned.

All scene recipes use the core `defineRecipe`/`composeRecipes` contract. Recipes
declare exclusive ownership and may expose named policies. Base scenes must not
retain inactive compatibility methods for recipe-owned behavior.

## Current objectives and likely next work

- Add real-browser scene lifecycle coverage and reproducible performance baselines.
- Pilot prereleases in independently maintained games before declaring `1.0`.
- Keep recipe mechanics independently removable and test cleanup of listeners,
  timers, bodies, and display objects.
- Improve sample presentation only in sample/recipe code; do not move domain
  rules into base scenes.

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
