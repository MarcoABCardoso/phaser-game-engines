# All-in-one RPG slice: ownership and replacement tour

The all-in-one sample is a compact expedition from title screen to exploration,
NPC conversations, a permanent choice, inventory preparation, turn-based
battle, progression, saving, and a result screen. It is an integration proof,
not a new RPG schema hidden inside the toolkit.

Run it locally with `npm run dev:all-in-one`, or play the same production build
from the documentation landing page at `/all-in-one/`.

## Follow the playable loop

1. Start a new expedition at the title screen.
2. Talk to Mira in the expedition camp and accept the field trial.
3. Collect the rusty sword, then cross the east portal into the signal grove.
4. Talk to Tarin and choose blade overcharge or shield stabilization. The
   permanent choice changes the battle statistics shown in the HUD.
5. Collect the sky charm, return to Mira through the named portal entry, and
   activate the encounter.
6. Equip the sword and charm in the inventory, return to the grove, and defeat
   both drones with Attack and Guard.
7. Inspect the level, credits, skill point, and field badge on the result screen.
8. Choose one of three slots in the pause menu, save, return to the title, and
   continue the same area, inventory, quest, NPC choice, settings, and
   progression state.

## Ownership map

| Concern | Sample-owned code | Toolkit seam used |
| --- | --- | --- |
| Authored areas | `public/maps/*.json`, `content/areas.js` | Tiled object-role conversion and top-down content validation |
| Area transitions | `AreaPortalEntity`, campaign `world` state | Entity lifecycle, trigger zones, scene restart |
| Conversations and choice | `field-trial.js`, `strategist.js`, `WorldScene` dialogue orchestration | Contextual actions and presentation handles |
| Quest and progression | `campaign.js`, `progression.js` | No RPG schema; plain headless state and rules |
| Inventory/equipment | `items.js`, `InventoryScene` callbacks | Opaque items, equipment rules, drag/drop recipe |
| Battle | `battle-rules.js`, `EncounterScene`, battle presentation | Generic battle scheduling, transactions, commands, and effects |
| Saves | `saves.js` | Snapshot codec, sequential migration, staged save store, raw recovery data |
| Menus/settings | `TitleScene`, `PauseScene`, `JournalScene`, `SettingsScene`, `ResultScene` | Ordinary Phaser scenes |
| Input | `input/controls.js`, `menu-gamepad.js`, browser buttons | Normalized keyboard/gamepad/touch intents and recipe controls |
| Audio/accessibility | `audio-director.js`, presentation models, campaign settings | Game-owned Web Audio and replaceable presenters |

## Replace the content pipeline

The maps use ordinary Tiled JSON. Phaser renders the `ground` tile layer, while
`convertTiledMap` reads only object layers assigned the `spawn`, `solids`, and
`entities` roles. Replace the SVG tileset, layer art, or full map without
changing `TopDownScene`. Keep the role names—or provide `engineRole` properties—
when retaining the converter.

To use LDtk, procedural rooms, or a server-provided level, replace
`WorldScene.getLevel()` and `pgeOnReady()` with an adapter that returns the same
validated level shape. No toolkit source edit is required.

## Replace campaign rules

The toolkit never knows that Mira gives a quest, Tarin changes attack or
defense, a battle awards experience, or a badge is a reward. Those decisions
live in small pure modules under `src/rules` and are composed by `campaign.js`.
Replace any rule module and retain the campaign method called by the scene, or
replace the campaign itself and update the few scene imports.

## Replace presentation and menus

World, battle, and inventory visuals are registered presenter or prefab
factories. Replace those factories while retaining their JSON-friendly model.
Title, pause, settings, journal, and result flows are ordinary sample-owned
Phaser scenes; delete or replace them without subclassing toolkit code.

Reduced motion and text scale are campaign settings passed into presentation
models. The Web Audio director is also sample-owned and can be replaced by
Phaser audio, middleware, or no audio at all.

## Replace persistence

`saves.js` combines the toolkit's generic snapshot codec and save store with the
sample's `campaign.snapshot()` and `campaign.restore()` boundary. Version 3 has
explicit sequential migrations from versions 1 and 2. The title and pause menus expose three
independent slots. Invalid JSON or an unmigratable envelope returns the untouched
raw value to the menu for recovery.

Replace local storage by injecting another storage adapter into
`createCampaignSaveService`; the campaign format and migration tests remain the
same. Replace the campaign format by incrementing `CAMPAIGN_SAVE_VERSION` and
adding the next sequential migration.

## Why this remains removable

Every RPG-specific decision is in the sample. The toolkit supplies lifecycle,
validation, deterministic controllers, storage mechanics, and optional Phaser
adapters. A game can replace maps, quests, stats, battles, menus, audio, saves,
or the scene structure without editing `node_modules` or copying a base scene.
