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

This sample connects top-down exploration, a turn-based encounter, and the
generic inventory module in one persistent campaign. Walk over the three world
collectibles, press **I** to open the inventory, drag equippable items to the
weapon/charm slots, and press **S** to run the game-owned alphabetical sort.
Double-click the tonic to restore HP and consume it. The nearby drone is tuned
to defeat the unequipped starting character; equipment, healing, and a mix of
Attack and Guard make the encounter winnable without displaying damage rolls
in advance. The battle scene uses a bottom-left player / top-right enemy layout,
live HP bars, target selection across two drones, defeated-enemy removal, and a
short victory or defeat overlay before returning to exploration.

The inventory scene also renders player HP, attack, and defense beside the generic
slot UI to demonstrate that games can compose arbitrary data into the screen.
