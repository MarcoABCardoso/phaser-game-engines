# Phaser Game Engines Roadmap

## Mission

This workspace provides reusable game-building structures without prescribing a
game's rules, content, presentation, or state schema.

The engines should own orchestration: lifecycle, timing, input translation,
physics adaptation, entity scheduling, queries, and deterministic transitions.
Games should own policy: what actions mean, which resources exist, how progress
is stored, how success and failure work, and how the result is presented.

The intended architecture has four layers:

1. **Headless contracts and controllers** — plain JavaScript state and decisions.
2. **Phaser adapters** — scenes, bodies, collisions, cameras, and device input.
3. **Opt-in mechanics** — reusable combat, health, dialogue, checkpoints, AI,
   spawning, and similar rules that not every game needs.
4. **Recipes and samples** — opinionated combinations that demonstrate complete
   games without turning those opinions into engine requirements.

## Design tests

A proposed engine feature should satisfy these questions:

- Can a game omit it without carrying its state or lifecycle?
- Can a game replace its policy without replacing unrelated orchestration?
- Can two reusable extensions compose without competing for a subclass hook?
- Can its deterministic decisions be tested without starting Phaser?
- Does a second materially different game benefit from the abstraction?

Shared infrastructure should be extracted only after at least two packages need
the same contract. Genre-specific movement and physics should remain in their
genre packages.

## Milestone 1 — Composable real-time foundations

Status: complete.

- [x] Add a small `@phaser-game-engines/core` package.
- [x] Define normalized, device-independent input intents.
- [x] Define contextual actions with availability and priority resolution.
- [x] Integrate intents and contextual actions into the top-down Phaser adapter.
- [x] Integrate input intents into the platformer adapter.
- [x] Replace platformer sign/checkpoint input competition with contextual
  actions.
- [x] Add a minimal lifecycle event contract that mechanics can observe without
  overriding scene hooks.
- [x] Add one non-combat top-down sample to prove that health and attacks are not
  required concepts.

Acceptance criteria:

- Keyboard, gamepad, AI, replay, or tests can provide the same intent shape.
- An entity can advertise an interaction without reading a Phaser key.
- Multiple nearby interactions resolve deterministically by availability,
  priority, and offer order.
- Existing top-down subclasses and the current sample continue to work.

## Milestone 2 — Platformer controller decomposition

Status: complete.

- [x] Extract locomotion, jump resolution, dash, wall traversal, ledge traversal,
  landing detection, and area transitions from the scene update loop.
- [x] Keep controller inputs and outputs Phaser-free; let the scene adapt Arcade
  Physics bodies to them.
- [x] Report landing facts such as drop distance and impact velocity instead of
  applying an HP rule in the movement kernel.
- [x] Preserve `PlatformerScene` as a compatibility facade while introducing the
  composable API.

Acceptance criteria:

- Traversal controllers have deterministic headless tests.
- A platformer can use landing events without HP or run failure.
- Traversal abilities can be installed independently and composed.

## Milestone 3 — Optional real-time mechanics

- Move health, damage, melee attacks, fall consequences, checkpoints, run
  failure, and opinionated enemies into opt-in mechanics or recipes.
- Replace the narrow `attackable` convention with capabilities such as
  `interactable`, `targetable`, `damageReceiver`, and game-defined capabilities.
- Keep dialogue reusable, but stop making it an automatic responsibility of the
  platformer scene.
- Convert the current top-down combat behavior into a basic action-adventure
  recipe.

Acceptance criteria:

- Both real-time engines can run with no health, combat, inventory, dialogue, or
  persistence state.
- Adding a new action or capability does not require editing a genre scene.
- Optional mechanics cleanly install and remove their listeners and resources.

## Milestone 4 — Generic world runtime

- Consolidate proven duplication in registries, entity lifecycle, spatial
  queries, trigger zones, portals, clocks, RNG, and serialization contracts.
- Define versioned level and entity schemas with useful development-time errors.
- Add lifecycle and cleanup contract tests.
- Do not merge genre-specific physics or locomotion for superficial symmetry.

Acceptance criteria:

- Platformer and top-down consume the same world contracts where their behavior
  is genuinely identical.
- Invalid content fails early with a path to the invalid field.
- Area teardown leaves no stale entities, listeners, bodies, or timers.

## Milestone 5 — Extensible battle orchestration

- Document lifecycle event payloads and stable event ordering.
- Add custom phase pipelines and schedulers.
- Support reactions, interrupts, participants entering or leaving schedules,
  and commands with multiple selection stages.
- Separate logical resolution from presentation pacing through an effect queue
  or pause/resume continuation contract.
- Add snapshots, cancellation behavior, and stronger default command validation.

Acceptance criteria:

- Pokémon-like PP/type rules, timing/action-command rules, and a non-elimination
  contest use different state schemas without controller changes.
- Presentation can await an animation without putting animation semantics into
  the battle controller.
- Event sequence and custom-phase behavior are contract-tested.

## Milestone 6 — Determinism, saves, and tooling

- Provide seedable RNG and explicit clock dependencies.
- Define versioned snapshots and migrations.
- Record and replay input intents and battle commands.
- Add debug views for lifecycle events, active capabilities, contextual actions,
  and controller state.
- Publish JSDoc types or generated TypeScript declarations for public contracts.

Acceptance criteria:

- A recorded session reproduces the same logical state from the same seed.
- Saved controller state restores without requiring Phaser display objects.
- Public package use does not require reading source code to discover schemas.

## Sample matrix

Abstractions are considered proven only when contrasting samples use them:

- Platformer: action/combat and non-combat precision or puzzle play.
- Top-down: action-adventure and stealth, farming, or dialogue exploration.
- Battle: HP/MP combat, PP/type combat, and a non-elimination negotiation or
  contest.

Visual variety alone is insufficient: samples must use materially different
rules and state schemas.
