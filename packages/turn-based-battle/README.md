# @phaser-game-engines/turn-based-battle

A generic, phase-driven battle state machine for Phaser games. The engine owns turn order progression, command timing, and event order. Games own their data model and rules: this package never assumes health, mana, damage, healing, attacks, or even a traditional combatant.

## Rules adapter

Pass a rules adapter to `BattleController` (or implement `getBattleRules()` in `BattleScene`). A game supplies:

- `createInitialState(spec)` — returns arbitrary game state.
- `getTurnOrder(state, context)` — returns participant IDs for the next round.
- `getAvailableCommands(state, activeId, context)` — returns game-defined commands.
- `resolveCommand(state, command, context)` — returns `{ state }`, `{ changes }`, and/or domain events.
- `getOutcome(state, context)` — returns `null` while ongoing, otherwise any game-defined result.

Optional `onBattleStart`, `onTurnStart`, `onTurnEnd`, and `validateCommand` hooks use the same inputs. A resolver may return event records such as `{ type: 'moveUsed', detail: {...} }`; the engine publishes those alongside lifecycle events including `turnStarted`, `commandRequested`, `beforeResolve`, `stateChanged`, `afterResolve`, and `battleEnded`.

```js
const rules = {
  createInitialState: (spec) => ({ creatures: spec.creatures }),
  getTurnOrder: (state) => state.creatures.map((creature) => creature.id),
  getAvailableCommands: (state, actorId) => [{ id: 'useMove', actorId }],
  resolveCommand: (state, command) => ({ state: resolveMyGameMove(state, command) }),
  getOutcome: (state) => state.finished ? { winner: state.winner } : null,
};
```

`applyChanges` is an optional generic helper for `set`, `increment`, `append`, and `remove` state patches. It does not attach gameplay meaning to any field. The Phaser `BattleScene` is similarly optional: subclasses supply menus, target choices, rendering, and commands through hooks.
