# Phaser Game Engines Roadmap

## Mission

Help a Phaser developer move from an idea to a small, tested, deployable game
without rebuilding genre plumbing or surrendering control of the game's rules.

This collection should provide a productive middle layer between Phaser and a
game: more useful than a bag of utilities, much less prescriptive than a full
game-making framework. Success means that developers spend their time on
content, feel, rules, and presentation—not scene lifecycle, input normalization,
content validation, save plumbing, or test harnesses.

## Where the repository stands

The previous roadmap successfully established the technical foundation. The
workspace now contains:

- a Phaser-free core with input, lifecycle, recipe, content, determinism,
  snapshot, replay, debug, and testing contracts;
- one runtime toolkit with platformer, top-down, turn-based, content, and
  explicit headless subpaths, plus a separate project generator;
- JavaScript and TypeScript project generation;
- content validation, migration, Tiled conversion, schemas, asset manifests,
  and Vite integration;
- six sample applications, three genre tutorials, package-selection and recipe
  guides, and a hosted documentation landing page;
- package-tarball consumer checks, declaration checks, sample builds, CI, and
  196 passing tests across 36 files as of July 2026.

The design is the repository's strongest asset. Headless logic is genuinely
separated from Phaser, game-specific policy is mostly kept out of base scenes,
and the turn-based package demonstrates schema independence with contrasting
rulesets.

The collection is now installable and testable from the public registry, but
its product experience is not yet proven with outside developers:

- the examples prove APIs but do not yet provide polished, reusable vertical
  slices of making and finishing a game;
- browser scene lifecycle, cleanup, input, and end-to-end game loops are not
  exercised in CI;
- the hosted documentation site gives developers a clear entry point, but its
  deeper pages still render raw Markdown and lack version selection;
- powerful facilities such as saves, replay, debug inspection, content tooling,
  and recipes exist as separate APIs, but generated projects do not make them
  part of one coherent daily workflow;
- no independently maintained game has established that the abstractions remain
  helpful after the first demo.

The current state is therefore **a strong engine foundation with an unproven
product experience**. The next roadmap is about adoption and game completion,
not adding more primitives.

## Outcomes and measures

The following measures replace feature count as the definition of progress.

| Outcome | Target before 1.0 |
| --- | --- |
| First run | A new user creates and runs a game from the public registry in 10 minutes or less |
| First meaningful change | The user adds content and one game rule in 30 minutes without editing package source |
| Complete loop | A starter demonstrates title/start, play, win or loss, restart, save where appropriate, and production build |
| Diagnostics | Invalid content and common setup failures identify the file, field, likely cause, and relevant guide |
| Browser confidence | Supported browsers run automated scene create/shutdown/restart, input, transition, and representative game-loop tests |
| Upgrade confidence | Pilot games upgrade to the release candidate using documented migrations and no engine-source patches |
| External proof | At least three games outside this workspace ship a playable build; at least one uses TypeScript and one is touch- or gamepad-first |
| Maintenance | Every supported public API has a documented owner, compatibility category, test, and example or reference page |

Measure onboarding with fresh environments and people unfamiliar with the
implementation. Do not count maintainer runs from a warm workspace as adoption
evidence.

## Release 0 — Make the toolkit genuinely installable

Priority: immediate. This is the gate for all useful external feedback.

- [x] Select a license and add it to the repository and every package tarball.
  The project uses the MIT License.
- [x] Confirm the npm scope and package names. The `phaser-game-engines` npm
  organization is owned by `macardoso95`; the public packages are
  `@phaser-game-engines/toolkit` and `@phaser-game-engines/create-game`.
- [x] Publish aligned `0.1.0` packages for the toolkit and project generator.
  Both public packages passed a clean registry install, representative headless
  imports, and installed CLI checks; `next` now points to verified `0.1.1`.
- [x] Configure trusted publishing from a supported cloud CI runner so future
  prereleases carry npm provenance without a long-lived publishing token. Both
  packages staged `0.1.1` through GitHub Actions OIDC as trusted automation,
  with publishing restricted to the staged workflow and human 2FA approval.
- [x] Audit manifests and release presentation: remove duplicate export entries,
  reconcile the private root version with package versions, verify repository
  links, and make prerelease status unambiguous.
- [x] Test the oldest practical Node version for consumers and require newer
  Node versions only where the tooling actually needs them. Browser runtime
  packages should not inherit CLI-only constraints unnecessarily. Manifests,
  documentation, and the pushed CI matrix cover Node 20.19, 22, and 24. The
  iterator-helper incompatibility found by Node 20 was fixed before release.
- [x] Make the generator runnable through one memorable public command and add
  `--help`, version reporting, non-interactive operation, and actionable
  install/network failure messages. The published
  `npm create @phaser-game-engines/game` command and installed version entry
  point have both been exercised from a clean consumer project.
- [x] Automate prerelease tags, changelog generation, tarball inspection,
  provenance, and a post-publish smoke test that installs from the registry.
  Release preparation, staged tarball inspection, OIDC publishing, and the
  exact-version smoke workflow were exercised on `0.1.1`; the registry run
  passed all 14 generated starter variants and representative production
  previews.
- [x] Publish a minimal hosted landing page that gives the package choice,
  install command, support status, and links to version-matched documentation.
  The responsive page is deployed at
  <https://marcoabcardoso.github.io/phaser-game-engines/> through GitHub Pages.

Exit criteria:

- A clean machine with no repository checkout can generate, install, test,
  build, and run each genre starter from published packages.
- The exact published tarballs pass the existing JavaScript, TypeScript,
  headless import, and sample smoke checks.
- A failed release cannot leave workspace package versions or documentation out
  of sync.

Release 0 completed on July 19, 2026. The exact `0.1.1` registry packages pass
automated export and installed-CLI checks, all 14 JavaScript and TypeScript
starter variants, and a production preview for each genre. CI is green on Node
20.19, 22, and 24; package versions, changelog entries, and documentation are
prepared together; the release was staged through trusted GitHub Actions OIDC,
approved with maintainer 2FA, and verified from the public registry. Release 1
is now the active milestone.

## Release 1 — Turn starters into productive game slices

Priority: immediate after the first prerelease.

The generator should create a small game developers want to modify, not merely
a scene that proves an import works.

- [ ] Redesign each generated starter around a visible objective and a complete
  loop: start, learn controls, play, reach a result, restart, test, and build.
- [ ] Keep a `minimal` template, and add one recommended template per genre that
  demonstrates the normal project structure for scenes, content, rules,
  presentation, tests, and assets.
- [ ] Generate content into separate validated files rather than embedding the
  entire level in the scene. Include an example custom entity or rule owned by
  the game.
- [ ] Offer recipes and input choices interactively while preserving stable CLI
  flags for automation. Generated touch and gamepad projects must be playable,
  not just wired to an adapter.
- [ ] Add opt-in save, debug, and replay choices to the generator. When selected,
  they should already work in the starter and have one focused test.
- [ ] Provide copyable presentation seams for sprites, animation, audio, HUD,
  menus, pause, and scene transitions without making placeholder art part of an
  engine package.
- [ ] Add deployment presets or short verified guides for at least GitHub Pages
  and one general static host, including correct Vite base-path handling.
- [ ] Run five observed onboarding sessions and record time-to-run,
  time-to-change, errors, abandoned steps, and copied engine code.

Exit criteria:

- At least four of five new users reach a running game within 10 minutes and a
  game-specific change within 30 minutes.
- Every recommended starter has a clear game loop, headless rule test, browser
  smoke test, production build, and deployment path.
- A developer can replace placeholder presentation without overriding engine
  internals or copying a base scene.

## Release 2 — Create one coherent authoring and debugging loop

Priority: high. Existing capabilities should feel like one toolkit.

- [ ] Replace the raw-Markdown viewer with a real documentation site containing
  rendered code, deep links, navigation, version selection, and package API
  reference generated or checked from public exports and declarations.
- [ ] Organize documentation by developer task: create a game, add content, add
  a mechanic, customize feel, save progress, debug a problem, test rules,
  upgrade, and deploy.
- [ ] Integrate content validation into generated development and CI commands.
  Editor/schema setup should work without manual path discovery.
- [ ] Add a development HUD entry point that can toggle lifecycle events,
  entities, contextual actions, collision geometry, active recipes, controller
  state, clock/RNG state, and content diagnostics.
- [ ] Make recording a failing play session and replaying it in a headless test
  a documented, end-to-end workflow with a small generated example.
- [ ] Define project-level save composition helpers for a current area, game
  state, installed recipe state, controllers, clock, and RNG, while keeping all
  game-specific fields explicit.
- [ ] Improve diagnostics at composition boundaries. Recipe conflicts, invalid
  entities, unsupported snapshot versions, and missing assets should say what
  the user can change next.
- [ ] Add migration examples for content and saves to the recommended starters,
  and test forward migration plus recovery from an invalid stored value.

Exit criteria:

- A developer can find the supported extension point for each starter task
  without reading `src/` in an engine package.
- A recorded starter failure can be attached to a bug report, replayed
  headlessly, and reduced to the first divergent checkpoint.
- Content validation, tests, production build, and documentation-link checks run
  through one generated-project verification command.

## Release 3 — Prove runtime correctness in real browsers

Priority: high and parallel with Release 2.

- [ ] Add Playwright or an equivalent browser runner for Chromium, Firefox, and
  WebKit at the versions the project commits to support.
- [ ] Cover scene create, shutdown, restart, area replacement, focus loss,
  resize, and repeated recipe installation/removal. Assert cleanup of event
  listeners, timers, physics bodies, display objects, and input handlers.
- [ ] Exercise keyboard, gamepad mapping, and touch/pointer controls through
  browser-visible behavior. Keep deterministic rules tested headlessly.
- [ ] Add one browser journey per recommended starter that reaches its win or
  loss state and restarts.
- [ ] Measure engine-added bundle cost separately from Phaser and publish the
  numbers for each release. Treat an unexplained regression as a release issue.
- [ ] Replace microbenchmark-only confidence with representative browser
  scenarios for entity counts, collision-heavy scenes, transitions, debug
  tooling, save size, and replay length on documented hardware profiles.
- [ ] Add a leak/stability soak that repeats scene and area lifecycles and
  reports retained engine-owned resources.

Exit criteria:

- Browser tests reproduce the lifecycle and cleanup guarantees documented by
  recipes and base scenes.
- Performance guidance states the tested scenario, browser, device class, Phaser
  version, engine version, and acceptable range; it does not promise universal
  frame rates from synthetic Node timings.
- Debug-only tooling is proven absent from recommended production builds unless
  explicitly enabled.

## Release 4 — Validate the design in real games

Priority: required before a 1.0 release candidate.

- [ ] Recruit at least three independently maintained pilot games with different
  constraints. Include JavaScript and TypeScript, keyboard and touch/gamepad,
  and at least two of the three supported genres.
- [ ] Establish a lightweight pilot cadence: setup interview, first playable,
  mid-project extension review, upgrade rehearsal, and ship retrospective.
- [ ] Track friction by developer outcome rather than requested feature. Record
  setup time, engine-source workarounds, unclear errors, extension difficulty,
  build size, browser defects, and upgrade cost.
- [ ] Move code into shared infrastructure only when two materially different
  pilot games need the same contract. Prefer a documented game-owned example
  when only one game needs it.
- [ ] Remove or redesign APIs that pilots consistently bypass, even if those
  APIs are internally elegant.
- [ ] Publish the pilot games or representative public reproductions and link
  each supported workflow to evidence from one of them.
- [ ] Rehearse upgrades through at least two prerelease versions without copying
  or patching package source.

Exit criteria:

- Three pilot games have public playable builds and can upgrade to the release
  candidate with documented steps.
- No pilot carries a fork, monkey patch, or copied base scene required to use a
  supported workflow.
- The prioritized backlog is based on observed friction from pilots and
  onboarding sessions.

## Release 5 — Commit to 1.0

Priority: only after Releases 0–4 meet their exit criteria.

- [ ] Inventory every export, subpath, lifecycle event, recipe policy, schema,
  snapshot, CLI flag, and generated-project convention. Mark each as stable,
  experimental, or internal.
- [ ] Reduce the stable surface where overlapping abstractions solve the same
  task. Add deprecation warnings and migrations before removal.
- [ ] Publish the semantic-versioning policy and compatibility matrix beside the
  versioned API reference.
- [ ] Freeze version-1 content and snapshot schemas and verify migrations from
  every public prerelease format that promised persistence.
- [ ] Define maintenance capacity: supported Node, Phaser, TypeScript, and
  browser ranges; security process; release cadence; and deprecation window.
- [ ] Run the complete external-consumer, browser, pilot-upgrade, documentation,
  package, and provenance suite against the release-candidate tarballs.
- [ ] Release `1.0` only when it represents a support commitment that can be
  maintained, not simply the exhaustion of this checklist.

## Work that waits

Until the current genres are installable, learnable, browser-tested, and proven
in real games, do not prioritize:

- additional genres;
- a custom renderer, physics engine, editor, asset store, or universal ECS;
- networking, rollback multiplayer, or hosted backend services;
- game-specific combat, health, inventory, quest, progression, or dialogue
  schemas in base scenes;
- a large catalog of mechanics without contrasting real-game consumers;
- optimization of Phaser's baseline bundle at the expense of clear APIs.

## Decision rule

Choose the next work item by asking:

> Will this measurably shorten the path from a fresh install to a tested,
> playable, deployable game for current users?

If the answer is unclear, improve a starter, observe a developer, or support a
pilot before adding another abstraction. Repository samples prove that code can
work; outside developers finishing games will prove that the collection is
useful.
