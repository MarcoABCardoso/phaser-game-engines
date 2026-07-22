# top-down starter

Generated as a JS recommended top-down project using the exploration recipe and keyboard input.

Run `npm install`, then `npm run dev`. Use `npm run verify` before shipping; it runs headless rules tests and a production build.

The game loop is title → controls → play → result → restart. Content, rules, presentation, input, and scene orchestration have explicit owners.

## Where to make changes

| Change | File | Owner |
| --- | --- | --- |
| Layout, spawn, or goal position | `src/content/level.js` | Your game content |
| Victory or defeat conditions | `src/rules/game-rules.js` | Your pure game rules |
| Applying an outcome, saving, or changing scenes | `src/scenes/GameScene.js` | Your game orchestration |
| Goal appearance | `src/entities/GoalEntity.js` | Your entity presentation |
| HUD, audio, or visual feedback | `src/presentation/presentation.js` | Your presentation |
| Phaser text styles | `src/presentation/styles.js` | Your presentation theme |
| Browser layout and controls | `src/style.css` | Your browser styles |
| Controls | `src/input/controls.js` | Your input adapter |

The toolkit owns movement, physics adaptation, entity scheduling, validation,
and lifecycle timing. The generated `GameScene` connects those package hooks to
your content, rules, and presentation. In particular, entities do not end the
stage: `GameScene.pgeOnTick()` gathers runtime facts, calls
`getStageOutcome()`, and applies the returned outcome once.

The player is a persistent, scene-owned actor because movement, physics,
camera follow, and area transitions all operate on it directly. Entries in
`entitySpecs` are area-scoped world entities and are rebuilt when an area changes.

`src/input/controls.js` exports the adapter passed to the scene as
`super({ controls })`. Add or remap keyboard/gamepad names in
`bindings.actions`. In touch projects, add an `actionButtons` entry to create
both the named action and its on-screen button.
