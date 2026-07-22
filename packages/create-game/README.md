# @phaser-game-engines/create-game

Generate a playable platformer, top-down, or turn-based Phaser slice with a
complete title/play/result/restart loop and headless rule tests:

```bash
npm create @phaser-game-engines/game -- my-game --genre platformer --language js
```

The recommended template separates toolkit integration from game-owned code:

| Concern | Owner |
| --- | --- |
| Movement, physics adaptation, validation, entity scheduling, lifecycle timing | Toolkit |
| Level layout and objective locations | Game content |
| Deciding whether the stage has ended | Pure game rules |
| Applying an outcome, saving, and changing scenes | Game scene |
| Entity appearance, HUD, and audio | Game presentation |

The generated scene evaluates the pure outcome rule from an explicit lifecycle
hook. Entities render and expose local state; they do not end the stage or
change scenes. Each generated README includes a file-by-file editing guide.

Every recommended platformer and top-down starter exports `controls` from
`src/input/controls.*` and injects it with `super({ controls })`. Keyboard and
gamepad bindings are declarative `move` and `actions` maps. Touch
`actionButtons` create both the named actions and their browser buttons. Add or
remap an action in that file; no `readInputIntent()` override or sentinel value
is required. The HUD control summary is derived from those definitions and the
adapter's prompt labels.

The player remains a scene-owned actor rather than an area-scoped world entity.
Traversal, colliders, camera follow, and area transitions require it to persist
while the entity store is torn down and rebuilt. Generated goal entities are
area-scoped and presentation-only.

Keep the compact import proof with `--template minimal`. It is a movement
sandbox, not a complete game loop. The equivalent direct command is
`npx @phaser-game-engines/create-game my-game`. Generation is non-interactive
with `--yes` or a complete set of flags, making it suitable for scripts and CI.
In a terminal, omitted choices are prompted. Use `--help` for all options or
`--version` to print the generator/package version.

Recipes include `precision-platformer`, `exploration`, `action-adventure`, and
`menu-presentation`. Every recommended genre accepts `--input keyboard`,
`--input gamepad`, or `--input touch`; touch projects include playable on-screen
controls and battle touch input submits real commands.

Use `--save`, `--debug`, and/or `--replay` to include working daily-development
seams plus one focused test for each. Use `--deploy github-pages` for a Pages
workflow with safe Vite base-path handling, or `--deploy static` for a verified
static-host build contract. Every generated project includes `npm run verify`.
Repository contributors can add `--package-source <repository-root>` to generate
a project using local workspace packages before they are published.

## Add a scene to an existing game

Use `add scene` to scaffold another engine scene without replacing or rewriting
the existing project:

```bash
npx @phaser-game-engines/create-game add scene . --genre battle --name EncounterScene
```

The command inspects `package.json`, infers JavaScript or TypeScript, refuses to
overwrite existing files, and prints the import and Phaser scene-registration
entry to add. Registration is deliberately manual because Phaser entry points
are game-owned code and do not have a single safe structure for the generator
to rewrite. Recommended scenes include separate content, rules, and rule tests;
use `--template minimal` for a single-file integration proof.

See the [versioned documentation](https://marcoabcardoso.github.io/phaser-game-engines/)
for genre selection, tutorials, support status, and toolkit extension points.
