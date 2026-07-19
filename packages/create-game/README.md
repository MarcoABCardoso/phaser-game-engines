# @phaser-game-engines/create-game

Generate a playable platformer, top-down, or turn-based Phaser slice with a
complete title/play/result/restart loop and headless rule tests:

```bash
npm create @phaser-game-engines/game -- my-game --genre platformer --language js
```

The recommended template separates scenes, validated content, game-owned rules
and entities, presentation, input, tests, and assets. Keep the compact import
proof with `--template minimal`. The equivalent direct command is
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

See the [versioned documentation](https://marcoabcardoso.github.io/phaser-game-engines/)
for genre selection, tutorials, support status, and toolkit extension points.
