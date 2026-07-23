# All-in-one RPG slice

This sample is the toolkit's growing RPG/exploration vertical slice. A top-down
world sleeps while inventory and turn-based battle scenes run, then wakes with
the same player and campaign state. Game-owned rules connect an NPC conversation,
visible quest objectives, equipment, encounter access, and the generic battle
outcome without moving RPG policy into toolkit scenes.

`src/input/controls.js` is the shared input composition point. It exports the
exploration intent adapter, battle keyboard/gamepad recipe options, readable
control labels, and the browser-button installer used by `main.js`.

Use this sample as the integration lab for features that cross scene or engine
boundaries. Keep simple, single-engine teaching examples in the `basic-*`
samples; the lab can favor breadth and explicit architecture over minimalism.

Run `npm run dev:all-in-one` from the repository root. Verify it with
`npm run build:all-in-one` and `npm test`.
The documentation Pages artifact embeds the production build at `/all-in-one/`;
the link becomes public when the Pages workflow publishes this revision.
See `docs/ALL_IN_ONE_SLICE.md` for a guided ownership and replacement tour.

Talk to Mira with **E** to begin the field trial. Find the rusty sword, cross
into the signal grove, make a permanent calibration choice with Tarin, and find
the sky charm. Return to Mira to activate the encounter, then press **I** to
open the inventory. Drag items, tap them, or select them with arrows and
**Z/Enter/gamepad A** to equip or use them. Press **S** to run the game-owned
alphabetical sort.

The sample connects top-down exploration, an NPC quest, a turn-based encounter,
and the generic inventory module in one persistent campaign. Walk over world
collectibles to pick them up.

Double-click the tonic to restore HP and consume it. The nearby drone is tuned
to defeat the unequipped starting character; equipment, healing, and a mix of
Attack and Guard make the encounter winnable without displaying damage rolls
in advance. The battle scene uses a bottom-left player / top-right enemy layout,
live HP bars, target selection across two drones, defeated-enemy removal, and a
short victory or defeat overlay before returning to exploration.

The inventory scene also renders player HP, attack, and defense beside the generic
slot UI to demonstrate that games can compose arbitrary data into the screen.

Pause to use three independent save slots, inspect the journal, or change
reduced motion, text scale, and audio. Saves include the active area and named
entry, per-area collectibles, inventory/equipment, quest and NPC decisions,
progression, rewards, and settings. Version-1 data migrates on load; corrupt
data is preserved and shown in the menu instead of being discarded.
