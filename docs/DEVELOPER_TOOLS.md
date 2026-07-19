# Developer tools

`@phaser-game-engines/toolkit/core` provides opt-in tools that remain separate from
production game rules:

- `captureSessionSnapshot` and `restoreSessionSnapshot` compose explicitly
  registered world, controller, recipe, clock, RNG, and game-owned state.
- `createMemoryStorage`, `createLocalStorageAdapter`, and `createSaveStore`
  provide named slots, staged writes, versions through a snapshot codec, and raw
  recovery data when decoding or migration fails.
- `createSessionRecorder` records normalized intents, battle commands, and state
  checkpoints. `createReplayViewer` supports pause, step, speed, and reports the
  first mismatching checkpoint.
- `createDebugOverlayMechanic` displays lifecycle time, active mechanics,
  contextual actions, controller state, and serializable clock/RNG state. Do not
  include the mechanic in production configuration.
- `createSimulationHarness` drives deterministic headless vertical slices.
  `measureBudget` reports repeatable synchronous timing against an explicit
  budget.
- `createBugReportBundle` includes versions, seed, recordings, and checkpoints;
  game-owned data is excluded unless the caller explicitly supplies it.

Initial project budgets are 2 ms for 1,000 simple headless entity updates, 1 ms
for a 1,000-item rectangle query, 100 KB for a small-game session snapshot, and
2 seconds for each production sample build on a warm local cache. Benchmark
results are environment-specific and should be recorded with Node, OS, CPU, and
package versions before changing these budgets.

Run `npm run benchmark` for the reproducible entity-update, spatial-query, and
snapshot-size baseline. The script exits non-zero when a budget is exceeded.
