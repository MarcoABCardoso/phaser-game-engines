# Changelog

This project follows semantic versioning. Until `1.0`, minor releases may
contain documented breaking changes.

## Unreleased

No changes yet.

## [0.1.1] - 2026-07-19

### Added

- Trusted staged-publishing, exact-version registry verification, and GitHub
  Pages workflows for repeatable prereleases.
- Automated release preparation that aligns versions and promotes curated
  `Unreleased` notes into a dated changelog section.
- A public-facing documentation landing page with package choice, installation,
  support status, and version-linked guides.

### Fixed

- Touch input adapters no longer rely on iterator helpers unavailable in the
  supported Node 20.19 runtime.

## [0.1.0] - 2026-07-18

### Added

- Node-safe `/headless` entry points for every runtime area.
- Generated TypeScript declarations for core, platformer, and top-down public
  exports, plus declaration consumer checks.
- Package tarball consumer verification and a Node 20.19/22/24 CI matrix.
- Consistent sample command aliases and support/release documentation.
- A project generator with tested JavaScript and TypeScript starters for each
  supported genre.
- JSON Schemas, headless genre validators, content migration/validation tooling,
  a Tiled object-layer adapter, Vite validation, and asset/animation manifests.
- Shared recipe composition with ownership/conflict diagnostics and named policy
  replacement.
- Precision/action platformer recipes, exploration/action-adventure top-down
  recipes, and an accessible keyboard/gamepad battle presentation recipe.
- Independent platformer health, melee, checkpoint, dialogue, failure, landing,
  and traversal-tuning mechanics.
- Composable session snapshots, save-slot adapters, replay divergence tools,
  simulation harnesses, debug overlays, bug-report bundles, and budget helpers.
- A locally buildable searchable documentation site plus versioning, security,
  contribution, support, and issue-reporting policies.

### Changed

- Consolidated the runtime, genre, and content-tool packages into
  `@phaser-game-engines/toolkit` subpaths. The project generator remains a
  separate package to support `npm create @phaser-game-engines/game`.
- Package export maps now identify declaration files explicitly.
- `PlatformerScene`, `TopDownScene`, and `BattleScene` now consume explicit
  recipes; base scenes no longer carry inactive gameplay or menu policy.
- The platformer compatibility scene and its game-specific boss entity were
  removed. The project intentionally does not preserve prototype compatibility
  before `1.0`.
- The top-down action-adventure combination is now a recipe rather than a
  separately wired registry and mechanic.
