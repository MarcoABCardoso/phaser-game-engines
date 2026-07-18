# First top-down game

## 1. Generate and run

```bash
npm run create:game -- my-top-down --genre top-down --language ts --package-source .
cd my-top-down
npm install
npm run dev
```

Choose `--input gamepad` or `--input touch` to replace the default keyboard
provider while preserving the same intent consumed by the scene.

## 2. Add an interaction

Add an interactable to the generated `entitySpecs` array:

```ts
{
  type: 'interactable', id: 'terminal', x: 260, y: 180,
  zone: { x: 220, y: 140, w: 80, h: 80 },
  label: 'Inspect terminal', message: 'The route is clear.',
}
```

The entity advertises an action; it does not read a keyboard key. Override
`onInteract(entity)` when the game needs behavior beyond the default message.

## 3. Add policy only when needed

Regenerate with `--recipe action-adventure` only if the game wants the example
health, attack, pickup, and enemy composition. Exploration games should keep the
minimal scene and install their own mechanics.

## 4. Test and ship

```bash
npm test
npm run typecheck
npm run build
```

The logic test uses the headless movement export. Deploy `dist/` as static files.

