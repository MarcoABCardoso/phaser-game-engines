# Releasing

Releases are intentionally manual while the packages are at `0.1.x`.

## Prerequisites

- Select and add the repository license before the first public npm release.
- Confirm npm publish access for the `@phaser-game-engines` scope.
- Start from a clean checkout on a supported Node version.

## Checklist

1. Move relevant entries from `Unreleased` in `CHANGELOG.md` into a versioned
   section and include migrations for every breaking change.
2. Run `npm run version:packages -- <version>` to align publishable package
   versions, internal dependency ranges, and the lockfile.
3. Run `npm ci` followed by `npm run verify`.
4. Inspect each tarball with `npm pack --dry-run --workspace <package-name>`.
5. Publish with a prerelease tag until the `1.0` acceptance criteria are met.
6. Create a signed Git tag and GitHub release containing the changelog section.

Do not publish from a working tree with uncommitted changes. Publishing
automation and provenance should be added only after the npm organization and
license are configured.
