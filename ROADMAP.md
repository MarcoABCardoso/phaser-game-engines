# Road to a credible game-building toolkit

## The product we are trying to earn

`@phaser-game-engines/toolkit` should be the layer a Phaser developer chooses
when a game has grown beyond a rendering experiment but should remain ordinary
JavaScript or TypeScript. It succeeds when it shortens the path from a new
project to a content-heavy, tested, save-compatible game without taking
ownership of the game's rules or presentation.

The toolkit is not credible because it has many primitives. It is credible when
developers can see those primitives survive a complete game loop, understand
where to extend them, upgrade without rewriting content, and remove any recipe
that stops fitting.

## Where we are now

The repository has a sound technical base:

- Phaser-free input, lifecycle, entity, recipe, persistence, replay, debug, and
  test contracts;
- Phaser 4 adapters for platformer, top-down, turn-based battle, and inventory;
- replaceable mechanics and recipes with explicit ownership and cleanup;
- content schemas, validation, migrations, a Tiled object-layer adapter, and
  Vite integration;
- generated JavaScript and TypeScript starters with working input, tests,
  builds, optional developer tools, and deployment presets;
- an all-in-one sample that carries campaign state through exploration,
  inventory, and a turn-based encounter.

The gap is product proof. The examples demonstrate APIs, but not yet the volume
and interconnectedness of a real game. Browser lifecycle guarantees are not
covered end to end, the public API is still prerelease, and independently
maintained games have not demonstrated that the abstractions remain helpful as
content and save data accumulate.

## Credibility gates

These are release gates, not aspirations. A `1.0` candidate must satisfy all of
them with linked evidence.

| Gate | Evidence required |
| --- | --- |
| First use | Four of five new users run a generated game in 10 minutes and make a game-owned change in 30 minutes |
| Complete slice | The all-in-one sample demonstrates authored areas, NPC interaction, quests, inventory/equipment, battle, progression, save/load, and restart as one coherent loop |
| Content workflow | Invalid files and cross-file references fail before play with a filename, property path, and useful next action |
| Browser correctness | Automated Chromium, Firefox, and WebKit journeys cover create, play, transitions, shutdown, restart, resize, focus loss, and representative input |
| Cleanup | Repeated scene and recipe lifecycles retain no toolkit-owned listeners, timers, bodies, display objects, or input handlers |
| Upgrade safety | Versioned content and saves migrate through every promised prerelease format to the release candidate |
| Real-game proof | Three independently maintained games publish playable builds and upgrade without package forks, monkey patches, or copied base scenes |
| Supportability | Every stable export, schema, event, recipe policy, and CLI flag has a compatibility category, test, and discoverable documentation |

## Workstream 1: Make the all-in-one sample the product proof

The all-in-one sample is the integration lab and the main adoption artifact. It
should become a compact RPG/exploration slice, not a catalogue of disconnected
features. Domain rules stay in the sample; only repeated, contrasting needs may
graduate into the toolkit.

Build the slice in playable increments:

- [x] Preserve campaign state across exploration, inventory, and battle scenes.
- [x] Demonstrate equipment modifying game-owned battle rules.
- [x] Demonstrate multi-target battle presentation and return to exploration.
- [x] Add an NPC conversation and quest loop with visible objectives and battle
  gating.
- [x] Split exploration across two authored areas with named entries, return
  positions, and persistent per-area entity state.
- [x] Render a real Tiled map while using validated toolkit object roles for
  spawns, solids, portals, and entities.
- [x] Add a second NPC with a branching choice and a consequence visible in
  exploration or battle.
- [x] Add rewards and character progression without moving stat policy into a
  base scene.
- [x] Add save slots, load, version migration, corrupt-save recovery, and a UI
  that makes those behaviors visible.
- [x] Add title, pause/settings, quest journal, result, and restart flows.
- [x] Add game-owned music and sound transitions, reduced motion, text scaling,
  and keyboard/gamepad/touch paths through the whole slice.
- [x] Produce a Pages-ready slice artifact and guided code tour explaining
  ownership and replacement seams.
- [ ] Publish the Pages artifact and verify the live slice URL.

Each increment needs a headless rule test, a browser-visible outcome, and an
explicit answer to: “Could a game replace this without editing toolkit source?”

## Workstream 2: Turn content into a daily authoring workflow

- [ ] Define and validate cross-file IDs for areas, entries, entities, items,
  conversations, quests, encounters, and assets.
- [ ] Add reference diagnostics and safe rename guidance rather than expanding
  base scene schemas with RPG policy.
- [ ] Show the supported boundary between Phaser-rendered Tiled layers and the
  toolkit's validated object data.
- [ ] Validate content in generated development, test, and production-build
  commands with no manual setup.
- [ ] Add hot-update examples and a campaign-state inspector suitable for
  debugging authored content.
- [ ] Publish migration examples that change content and save schemas together.

## Workstream 3: Prove runtime behavior in browsers

- [ ] Add Playwright coverage for the supported Chromium, Firefox, and WebKit
  versions.
- [ ] Drive keyboard, pointer/touch, and gamepad mappings through visible game
  behavior; keep deterministic rule permutations in headless tests.
- [ ] Cover scene sleep/wake, start/stop, area replacement, inventory and battle
  overlays, focus loss, resize, restart, and failed transitions.
- [ ] Add lifecycle soaks that count toolkit-owned resources before and after
  repeated scene and recipe teardown.
- [ ] Publish representative browser performance scenarios for entity counts,
  collisions, transitions, save size, and replay length, with environment and
  toolkit/Phaser versions attached.
- [ ] Measure toolkit-added bundle cost separately from Phaser and investigate
  unexplained release-to-release growth.

## Workstream 4: Make adoption and escape routes obvious

- [ ] Organize documentation around jobs: start, add content, add a mechanic,
  connect scenes, save, debug, test, upgrade, deploy, and replace an abstraction.
- [ ] Publish a decision guide for scene adapters versus headless controllers
  versus plain Phaser.
- [ ] Give every recipe an assumptions section, replacement example, cleanup
  guarantee, and minimal integration test.
- [ ] Replace the raw-Markdown documentation viewer with rendered, linkable,
  versioned guides and checked API references.
- [ ] Run and record onboarding sessions using public packages and cold
  environments; fix observed failure points before adding convenience APIs.
- [ ] Keep npm descriptions, version badges, Phaser compatibility, examples,
  and hosted documentation synchronized by release checks.

## Workstream 5: Validate with games we do not control

- [ ] Recruit three pilot games with different genre, language, and input
  constraints.
- [ ] Review each at setup, first playable, first custom mechanic, content-scale
  milestone, upgrade, and ship.
- [ ] Track engine-source workarounds, unclear diagnostics, copied code,
  extension cost, save migrations, browser failures, and abandoned APIs.
- [ ] Promote a contract into the toolkit only after materially different games
  need the same boundary. Keep one-off RPG behavior as sample/reference code.
- [ ] Redesign APIs that pilots consistently bypass, even when their internal
  implementation is elegant.

## Workstream 6: Make the 1.0 support promise

- [ ] Inventory every export, subpath, event payload, schema, snapshot, recipe
  policy, CLI flag, and generated convention as stable, experimental, or
  internal.
- [ ] Remove overlapping public abstractions or deprecate them with migrations.
- [ ] Freeze version-1 content and snapshot contracts and test all promised
  upgrade paths.
- [ ] Publish supported Node, Phaser, TypeScript, browser, and deployment ranges,
  plus release cadence and deprecation windows.
- [ ] Run package, browser, documentation, pilot-upgrade, and provenance checks
  against the exact release-candidate tarballs.

## What waits

Until the credibility gates are met, do not prioritize additional genres, a
custom renderer or editor, a universal ECS, networking, hosted services, or a
large mechanic catalogue. Do not move quests, HP, damage, progression, item
effects, or conversation schemas into generic base scenes merely to make the
sample shorter.

## How to choose the next task

Prefer work that removes a visible break in this chain:

> install → author content → play a complete loop → diagnose a failure → save
> and restore → upgrade → ship

When two tasks are otherwise equal, improve the all-in-one slice or unblock an
external pilot. A repository test proves code works; a maintained game proves
the toolkit is useful.
