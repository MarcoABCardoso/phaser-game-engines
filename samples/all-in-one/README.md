# all-in-one toolkit lab

This sample deliberately combines toolkit engines instead of presenting another
isolated vertical slice. A top-down world sleeps while a turn-based battle scene
runs, then wakes with the same player and physics state. Game-owned campaign
state passes encounter context and receives the generic battle outcome.

`src/input/controls.js` is the shared input composition point. It exports the
exploration intent adapter, battle keyboard/gamepad recipe options, readable
control labels, and the browser-button installer used by `main.js`.

Use this sample as the integration lab for features that cross scene or engine
boundaries. Keep simple, single-engine teaching examples in the `basic-*`
samples; the lab can favor breadth and explicit architecture over minimalism.

Run `npm run dev:all-in-one` from the repository root. Verify it with
`npm run build:all-in-one` and `npm test`.
