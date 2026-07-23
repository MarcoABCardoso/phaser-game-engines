# @phaser-game-engines/toolkit/battle

A generic, phase-driven battle state machine for Phaser games. The engine owns turn order progression, command timing, and event order. Games own their data model and rules: this package never assumes health, mana, damage, healing, attacks, or even a traditional combatant.

Use `@phaser-game-engines/toolkit/battle/headless` in Node tests,
simulations, servers, or a custom renderer. It exports the controller,
scheduler, and state helpers without evaluating Phaser. The package root also
exports the optional Phaser scene adapter.

## Rules adapter

Pass a rules adapter to `BattleController` (or implement `getBattleRules()` in `BattleScene`). A game supplies:

- `createInitialState(spec)` — returns arbitrary game state.
- `getTurnOrder(state, context)` — returns participant IDs for the next round.
- `getAvailableCommands(state, activeId, context)` — returns game-defined commands.
- `resolveCommand(state, command, context)` — returns `{ state }`, `{ changes }`, and/or domain events.
- `getOutcome(state, context)` — returns `null` while ongoing, otherwise any game-defined result.

Optional `onBattleStart`, `onTurnStart`, `onTurnEnd`, and `validateCommand` hooks use the same inputs. A resolver may return event records such as `{ type: 'moveUsed', detail: {...} }`; the engine publishes those alongside lifecycle events. The package includes TypeScript declarations for the rules, state, command, transaction, phase, scheduler, and snapshot contracts.

```js
const rules = {
  createInitialState: (spec) => ({ creatures: spec.creatures }),
  getTurnOrder: (state) => state.creatures.map((creature) => creature.id),
  getAvailableCommands: (state, actorId) => [{ id: 'useMove', actorId }],
  resolveCommand: (state, command) => ({ state: resolveMyGameMove(state, command) }),
  getOutcome: (state) => state.finished ? { winner: state.winner } : null,
};
```

`applyChanges` is an optional generic helper for `set`, `increment`, `append`, and `remove` state patches. It does not attach gameplay meaning to any field. The Phaser `BattleScene` is similarly optional and has no menu policy. Add `createBattlePresentationRecipe()` for command and target menus, remappable keyboard/gamepad navigation, AI/effect pacing, reduced motion, readable focus, and text scaling. Games still supply every command, target, rule, and state renderer.

`BattleScene` calls the prefixed extension hooks `pgeCreateBattleDisplay()`,
`pgeRenderBattleState(state)`, and `pgeOnBattleEvent(type, payload)`. The `pge`
prefix distinguishes toolkit-invoked hooks from ordinary game-owned helpers and
callable scene APIs.

```js
class MyBattleScene extends BattleScene {
  constructor() {
    super({ recipes: [createBattlePresentationRecipe({ textSize: 20 })] });
  }
}
```

Register composite UI under the scene's `presentation.presenters` option.
`createBattleResultPresentationRecipe()` listens for `battleEnded`, optionally maps
the game-owned outcome to a view model, and mounts `battle.result`. The engine never
interprets the outcome:

```js
super({
  recipes: [createBattleResultPresentationRecipe({
    getModel: (outcome) => ({ title: outcome.winner ? 'Victory' : 'Defeat' }),
  })],
  presentation: {
    presenters: {
      'battle.result': ({ scene, model }) => createResultPanel(scene, model),
    },
  },
});
```

The returned presentation handle is removed automatically on scene shutdown. A
presenter may instead return `{ root, update, destroy }` for explicit lifecycle
control.

## Event contract and ordering

Every payload contains `{ type, time, state }`. `state` is the current `{ machine, game }` object and `time` comes from the injected clock. Additional stable fields are:

| Event | Additional payload |
| --- | --- |
| `phaseChanged` | `{ phase, previousPhase }` |
| `battleStarted` | none |
| `roundStarted` | `{ round, schedule }` |
| `turnStarted`, `turnEnded` | `{ phase, command? }` |
| `commandRequested` | `{ commands }` |
| `commandSelectionRequested` | `{ stage, stageIndex, selections }` |
| `commandSelectionSubmitted` | `{ stage, value }` |
| `commandSubmitted`, `beforeResolve`, `afterResolve` | `{ command }` |
| `stateChanged` | `{ changes, command?, phase? }` |
| `scheduleChanged` | `{ schedule }` |
| `reactionQueued`, `interruptQueued`, `reactionStarted`, `reactionEnded` | `{ command }` |
| `effectQueued`, `effectRequested`, `effectCompleted` | `{ effect }` |
| `battleEnded` | `{ outcome }` |
| `battleCancelled` | `{ reason }` |
| `battleRestored` | `{ version }` |

For the default pipeline, one normal turn is ordered as follows. Domain events from a transaction occur after `stateChanged` and before `afterResolve`.

```text
phaseChanged(turn-start) → turnStarted
phaseChanged(command-selection) → commandRequested
commandSubmitted
phaseChanged(resolving) → beforeResolve → stateChanged/domain events → afterResolve
[phaseChanged(presentation) → effectRequested → effectCompleted]*
phaseChanged(turn-end) → turnEnded
```

`battleEnded` can occur after any hook or transaction that produces a terminal outcome. A cancellation instead ends with `phaseChanged(cancelled)` and `battleCancelled`.

## Pipelines, schedulers, reactions, and effects

Pass `pipeline` to add arbitrary phases. A phase entry may publish an `event`, invoke a rule `hook`, or use `rules.runPhase(state, phaseId, context)`. Keep one command pause and one resolution entry. Pass a scheduler with `createSchedule(state, context)` and `next(schedule, context)` to replace round-robin scheduling.

Transactions can contain schema-free orchestration directives:

```js
return {
  schedule: { remove: ['departed'], prepend: ['newcomer'] },
  interrupts: [{ id: 'counter', actorId: 'guardian' }],
  reactions: [{ id: 'cheer', actorId: 'crowd' }],
  effects: [{ id: 'show-result', result }],
};
```

Interrupts resolve before reactions. Logical state resolves synchronously; opaque effects then pause the pipeline in `presentation`. A presenter handles `effectRequested` and calls `completeEffect()` after its animation, audio, or UI work. In a `BattleScene`, call `completeBattleEffect()` instead so the scene refreshes and menu/AI presentation resumes automatically. No presentation concept enters game state or the rules adapter.

For multi-stage selection, rules return `getCommandStages()` entries with game-defined options and implement `createCommand(state, draft, context)`. Call `submitSelection(value)` for each stage. A complete command may still be submitted directly with `submitCommand()`.

## Validation, cancellation, snapshots, and replay

Default validation requires an object with a non-empty `id`, the active `actorId`, and a match in `getAvailableCommands()`. Object command templates match every field they advertise, so a game can constrain a move, mode, or other selection without a custom validator. `validateCommand` may add domain checks.

`cancel(reason)` is idempotent and prevents further progression. `snapshot()` returns a versioned, structured-cloneable envelope containing all logical controller state, pending selections/effects/reactions, and restorable RNG/clock state. Restore by passing `snapshot` to the constructor or calling `restore()`. Snapshot data never includes Phaser objects.

Use `createSeededRng`, `createManualClock`, and `createSessionRecorder` from `@phaser-game-engines/toolkit/core` for deterministic sessions. Passing the recorder to a battle records accepted commands; `replaySession` can submit those commands to a controller created with the same seed.
