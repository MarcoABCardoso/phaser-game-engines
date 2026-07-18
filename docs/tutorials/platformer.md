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
inherits movement, jumping, camera, world lifecycle, and validation.

## 2. Change the level

Open `src/main.js` in the generated project. Add another rectangle to
`floorSegments` or add a solid platform:

```js
platforms: [
  { id: 'step', x: 280, y: 410, w: 140, h: 20, kind: 'platform' },
],
```

Content is validated before Phaser bodies are constructed. Invalid dimensions
report the field path rather than failing later in the physics loop.

## 3. Add a game rule

Override a fact-oriented hook without changing traversal:

```js
onLanding({ drop, impactVelocity }) {
  if (drop > 240) this.setMessage(`Hard landing: ${Math.round(impactVelocity)}`);
}
```

The controller reports landing facts. Whether they mean damage, noise, score,
or nothing remains game policy.

## 4. Test and ship

The generated test imports `platformer/headless`, so it runs without a canvas:

```bash
npm test
npm run build
```

Deploy the generated `dist/` directory to any static host.
