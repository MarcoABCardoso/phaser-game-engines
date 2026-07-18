# Phaser Game Engines Roadmap

## Direction

The first roadmap established the architecture: Phaser-free controllers,
data-driven rules, optional mechanics, shared world contracts, deterministic
state, and thin Phaser adapters. The next roadmap turns that foundation into a
toolkit that developers can adopt quickly and trust throughout a small game's
lifecycle.

The goal is not to become a general-purpose replacement for Phaser. The goal is
to remove the repeated work between a new Phaser project and a playable,
testable game while leaving the game's rules, content, and presentation in the
game.

## Current assessment

As of July 2026, the repository is a tested prerelease toolkit with installable
packages, generators, content tooling, recipes, and developer-loop utilities.

What is already valuable:

- Four focused packages cover shared headless contracts, platforming, top-down
  movement, and turn-based orchestration.
- The architecture cleanly separates deterministic decisions from Phaser
  presentation and physics adaptation.
- Capabilities, lifecycle events, mechanics, rules adapters, registries, and
  explicit clock/RNG dependencies provide credible extension points.
- Contrasting battle samples demonstrate that the battle controller does not
  prescribe an HP/damage schema.
- The test suite has 194 passing tests across 36 files, and all six sample
  applications produce successful Vite builds.

What still limits adoption:

- A license, npm organization, publication credentials, and provenance are
  owner/external decisions that remain unresolved.
- Browser lifecycle automation and measured performance baselines still need a
  real browser runner and representative target hardware.
- The recipes and tools need feedback from independently maintained games;
  workspace samples cannot prove adoption quality by themselves.
- The searchable documentation site is buildable but not yet hosted or
  versioned with published releases.

The collection is therefore best described as **architecturally mature but
product immature**. The next work should prioritize the adoption path and daily
developer workflow over adding more low-level abstractions.

## North-star outcomes

The roadmap should be judged by developer outcomes rather than the number of
features shipped:

- A developer can create, run, understand, and modify a first playable example
  in 15 minutes.
- A TypeScript user gets useful types and editor completion for every supported
  public export without inspecting package source.
- A JavaScript user gets equivalent API documentation and actionable runtime
  validation errors.
- Headless controllers can be imported in Node without loading Phaser or
  requiring browser globals.
- Every release is tested as an external consumer would install it.
- Common game loops can be assembled from recipes without inheriting unrelated
  health, combat, inventory, dialogue, or persistence policy.
- A developer can validate content, inspect runtime state, save, replay, and test
  the logical game without building bespoke tooling first.

## Product principles

- **Optimize the first hour.** Installation, examples, errors, and defaults are
  product features.
- **Keep policy opt-in.** Engine packages orchestrate; games and recipes define
  gameplay meaning and presentation.
- **Make the headless path explicit.** Pure controllers and utilities must stay
  usable in Node tests, servers, simulations, and tools.
- **Prefer progressive disclosure.** A starter should be simple, while advanced
  extension points remain available without forking an engine scene.
- **Prove abstractions twice.** Promote a mechanic into shared infrastructure
  only after two materially different games need the same contract.
- **Earn compatibility.** Before `1.0`, prefer a clean documented design over a
  dormant facade. At `1.0`, public contracts gain normal semantic-versioning
  protection.
- **Ship vertical slices.** Each milestone must leave developers with a usable
  workflow, not only new internal primitives.

## Milestone 1 — Trustworthy packages and public API

Priority: now.

Status: in progress (implementation complete; owner/external publication gates remain).

Make the workspace safe to install and upgrade before expanding its feature
surface.

- [x] Correct the root quick start and give every sample a consistent
  `dev:<name>` and `build:<name>` command.
- [x] Add repository, issue-tracker, keywords, side-effect, and support metadata
  to published packages; document supported Node, Phaser, and browser versions.
- [ ] Select and add a repository license before public publication. This is an
  owner decision rather than an implementation default.
- [x] Define explicit browser and headless entry points. Importing a controller,
  schema, or rules engine in Node must not evaluate Phaser.
- [x] Add TypeScript declarations for every public export and exported subpath;
  test declarations with representative TypeScript consumer projects.
- [x] Document the supported public surface and mark compatibility-only or
  experimental APIs. Stop relying on source comments as the primary API guide.
- [x] Add CI for unit tests, all sample builds, package export checks, strict
  declaration consumers, and clean install-from-tarball smoke tests on the
  Node support matrix.
- [ ] Select and enforce a formatter and linter without creating a repository-wide
  mechanical rewrite that obscures behavioral changes.
- [x] Add aligned workspace versioning, a changelog, and a release checklist.
- [ ] Add provenance-enabled prerelease publishing after the license and npm
  organization are configured.

Acceptance criteria:

- Fresh JavaScript and TypeScript Vite projects can install each packed package,
  import every documented entry point, build, and run a smoke scene.
- Headless imports pass in supported Node versions with no DOM shims.
- CI catches stale documentation commands, missing declarations, broken exports,
  and unpublished workspace dependencies.
- A prerelease can be produced from a clean checkout using documented commands.

## Milestone 2 — Golden paths from install to first playable

Priority: now, after the package contract is stable.

Status: complete.

Turn the existing samples into learning paths and reusable starting points.

- [x] Provide minimal JavaScript and TypeScript starters for platformer,
  top-down, and turn-based games. Starters consume package tarballs or published
  packages rather than workspace source paths.
- [x] Add a small project generator that selects genre, language, input adapters,
  and an optional recipe without generating hidden framework code.
- [x] Write one end-to-end tutorial per genre: create a project, define content,
  add a game-specific rule, test it headlessly, build, and deploy.
- [x] Add focused recipes for common extension tasks: a custom entity, a
  contextual action, a mechanic with cleanup, an area transition, a battle
  rules adapter, and presentation pacing.
- [x] Give every sample an on-screen control legend, objective, reset path, and
  link back to the concepts it demonstrates.
- [x] Add reusable keyboard, gamepad, and touch intent adapters with remapping and
  input-prompt metadata. Keep the intent contract independent of devices.
- [x] Publish a package-selection guide explaining when to use core directly,
  a genre scene, a headless controller, or an opinionated recipe.

Acceptance criteria:

- A new developer can reach a controllable, editable game in 15 minutes using
  only public documentation.
- Each starter contains a headless logic test and a production build command.
- Switching keyboard to gamepad or touch does not change game rules.
- Samples are small enough to learn from and complete enough to communicate why
  the engine is useful.

## Milestone 3 — Content and asset workflow

Priority: next.

Status: complete.

Reduce the largest source of repeated Phaser project work: translating authored
content and assets into validated runtime objects.

- [x] Publish JSON Schemas and matching TypeScript types for shared worlds,
  entities, portals, platformer levels, top-down levels, and recipe configuration.
- [x] Add a CLI command that validates content without starting Phaser and
  reports exact file and property paths.
- [x] Add opt-in Tiled adapters for platformer and top-down maps. Define a small,
  documented mapping from Tiled layers, objects, and custom properties to engine
  schemas rather than coupling the runtime to Tiled internals.
- [x] Provide versioned content migrations and a dry-run migration command.
- [x] Add an asset manifest and preload helper for images, atlases, tilemaps,
  audio, and fonts, with duplicate-key and missing-asset diagnostics.
- [x] Add data-driven animation definitions that recipes can reference without
  requiring animation names in headless game state.
- [x] Make Vite development refresh content and asset definitions without losing
  useful validation context.

Acceptance criteria:

- One platformer and one top-down sample are authored in Tiled and use the same
  runtime contracts as hand-authored levels.
- Invalid content fails before scene construction with a source file and exact
  property path.
- A developer can add an entity type, validate it in CI, and preview it without
  editing an engine package.
- Asset loading errors identify the manifest entry and consumer-facing key.

## Milestone 4 — Practical recipes without schema lock-in

Priority: next, informed by starter usage.

Status: complete.

Package the workflows developers repeatedly need, while keeping the generic
engines small.

- [x] Remove prototype policy from `PlatformerScene`; attack, health,
  checkpoints, dialogue, and run failure now exist only as named recipes or
  mechanics, with no migration facade.
- [x] Provide a precision-platformer recipe and an action-platformer
  recipe as distinct compositions of traversal and optional mechanics.
- [x] Provide exploration and action-adventure top-down recipes that share world
  infrastructure but not mandatory combat or inventory state.
- [x] Provide an optional battle presentation recipe with command menus, target
  selection, keyboard/gamepad navigation, effect pacing, and accessible text
  output. Battle rules remain entirely game-owned.
- [x] Keep mechanics genre-local until contrasting recipes prove
  the same contract—for example dialogue flow, inventory operations, objectives,
  or transitions.
- [x] Define recipe composition rules, conflict diagnostics, lifecycle ownership,
  and a clear way to replace one policy without replacing the rest of a recipe.
- [x] Add accessibility defaults for remapping, hold alternatives, reduced
  motion, readable focus state, and text scaling in provided presentation code.

Acceptance criteria:

- Each recipe is assembled from documented, independently removable mechanics.
- The generic scenes carry no mandatory combat, health, inventory, dialogue, or
  save schema.
- A sample replaces one recipe policy without subclassing or copying the recipe.
- Phaser scene lifecycle integration tests prove that installing and removing a
  recipe leaves no listeners, timers, bodies, or UI objects behind.

## Milestone 5 — Save, debug, replay, and test loops

Priority: next.

Status: in progress (core APIs complete; browser and real-hardware gates remain).

Turn existing determinism primitives into daily development tools.

- [x] Define a game-level session snapshot that composes world, scene,
  controller, recipe, clock, RNG, and game-owned state without serializing Phaser
  objects.
- [x] Add opt-in storage adapters for memory and browser local storage, including
  save slots, atomic writes, schema versions, and migration failure recovery.
- [x] Build a development overlay for lifecycle events, active mechanics,
  capabilities, contextual actions, controller state, collision bounds, and the
  current RNG/clock position.
- [x] Add input/command recording controls and a replay viewer with pause, step,
  speed, and divergence reporting.
- [ ] Provide browser scene lifecycle checks; the headless simulation harness and
  vertical-slice examples are complete.
  checks, plus examples of testing a custom rule and a full vertical slice.
- [x] Add deterministic bug-report bundles containing content versions, seed,
  recorded inputs, and engine versions while excluding game-defined sensitive
  data by default.
- [x] Establish initial performance budgets and a reproducible benchmark for
  entity updates, spatial queries, and snapshot size. Sample production builds
  publish their startup bundle sizes in every verification run.

Acceptance criteria:

- A starter game can save, reload, migrate, and replay a session using public
  APIs and an opt-in storage adapter.
- A failed replay identifies the first divergent event or state checkpoint.
- Browser tests cover scene creation, shutdown, area replacement, and one full
  game loop for each genre.
- Debug tooling can be excluded from production bundles.

## Milestone 6 — Stable 1.0 and a maintainable ecosystem

Priority: later, after feedback from real projects.

Status: in progress; 1.0 remains intentionally gated on external use.

- [ ] Pilot the prereleases in at least three small games maintained outside this
  workspace, including one TypeScript game and one touch- or gamepad-first game.
- [ ] Collect friction reports around setup time, extension points, content
  authoring, upgrades, bundle size, and debugging; prioritize measured friction
  over speculative features.
- [ ] Host and version the implemented searchable documentation site with
  published releases; its local production build is complete.
  guides, runnable examples, migration notes, and architectural decisions.
- [x] Declare semantic-versioning rules for JavaScript APIs, TypeScript types,
  lifecycle events, content schemas, snapshots, and recipe behavior.
- [x] Add contribution guides, issue templates, security reporting, and a support
  policy with a realistic maintenance scope.
- [x] Remove prototype compatibility APIs before `1.0`; no dormant facade is
  carried into the supported design.
- [ ] Release `1.0` only after the package, starter, content, save, and debugging
  paths are exercised by external projects and covered by compatibility tests.

Acceptance criteria:

- The three pilot games can upgrade to the release candidate without copying or
  patching engine source.
- Every breaking change category has an explicit policy and migration example.
- The documentation and examples match the released version automatically.
- `1.0` represents a support commitment, not merely completion of a feature list.

## Explicit non-goals for this roadmap

- Adding more genres before the current three have excellent adoption paths.
- Building a custom renderer, physics engine, visual editor, or asset store.
- Prescribing a universal entity-component system or game-state schema.
- Moving sample-specific visuals or HP/damage rules into generic scene classes.
- Shipping networking, rollback multiplayer, or hosted backend services before
  local deterministic sessions and saves are proven.
- Optimizing Phaser's baseline bundle size at the expense of clear package
  boundaries; measure engine-added cost separately from Phaser itself.

## Prioritization rule

When choosing between roadmap items, prefer the work that shortens the path from
installation to a tested playable game for the largest number of developers.
New primitives or mechanics should wait unless a starter, pilot game, or repeated
support problem demonstrates the need.
