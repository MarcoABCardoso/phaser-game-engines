# @phaser-game-engines/create-game

Generate a minimal platformer, top-down, or turn-based Phaser project with a
headless logic test:

```bash
npx @phaser-game-engines/create-game my-game --genre platformer --language js
```

Use `--recipe action-adventure` with `--genre top-down` to opt into that recipe.
Real-time starters accept `--input keyboard`, `--input gamepad`, or
`--input touch`. Touch starters include a minimal accessible on-screen control
panel; games can replace its presentation without changing the intent adapter.
Repository contributors can add `--package-source <repository-root>` to generate
a project using local workspace packages before they are published.
