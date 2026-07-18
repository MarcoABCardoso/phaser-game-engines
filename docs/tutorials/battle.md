# First turn-based game

## 1. Generate and run

```bash
npm run create:game -- my-battle --genre battle --language ts --package-source .
cd my-battle
npm install
npm run dev
```

The generated `rules.ts` is the game. The controller does not know about HP,
damage, attacks, or elimination.

## 2. Change the rules

Add any state field in `createInitialState`, advertise a command from
`getAvailableCommands`, and return replacement state from `resolveCommand`.
Finish with any game-defined outcome from `getOutcome`:

```ts
getOutcome: state => state.score >= 5 ? { kind: 'quota-reached' } : null,
```

Rules must return new logical state and domain events. Phaser objects and
animations belong in the scene.

## 3. Pace presentation

A transaction can return opaque `effects`. `Battle` pauses in presentation and
publishes `effectRequested`; the scene completes its animation and calls
`completeEffect()`. This keeps animation duration out of deterministic rules.

## 4. Test and ship

```bash
npm test
npm run typecheck
npm run build
```

The generated test resolves a complete battle through the `/headless` entry
point. Deploy `dist/` as static files.

