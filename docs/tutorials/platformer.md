# First platformer

## 1. Generate and run

From this repository, generate a JavaScript starter backed by local packages:

```bash
npm run create:game -- my-platformer --genre platformer --language js --package-source .
cd my-platformer
npm install
npm run dev
```

The generated scene extends `PlatformerScene`, supplies plain level data, and
inherits movement, jumping, camera, world lifecycle, entity scheduling, and
validation. Its README includes a file-by-file ownership guide.

## 2. Change the level

Open `src/content/level.js` in the generated project. Add another rectangle to
`floorSegments` or add a solid platform:

```js
platforms: [
  { id: 'step', x: 280, y: 410, w: 140, h: 20, kind: 'platform' },
],
```

Content is validated before Phaser bodies are constructed. Invalid dimensions
report the field path rather than failing later in the physics loop.

## 3. Change the stage rule

Edit `src/rules/game-rules.js`. The rule is pure and returns an outcome rather
than changing Phaser scenes:

```js
export function getStageOutcome({ player, goal }, radius = 48) {
  const reachedGoal = Math.hypot(player.x - goal.x, player.y - goal.y) <= radius;
  return reachedGoal ? { kind: 'won' } : null;
}
```

`GameScene.pgeOnTick()` gathers the player and goal positions, calls this rule,
and passes a returned outcome to `finishStage()`. The goal entity only renders
the marker; it does not own the stage lifecycle.

## 4. Test and ship

The generated test imports `platformer/headless`, so it runs without a canvas:

```bash
npm test
npm run build
```

Deploy the generated `dist/` directory to any static host.
