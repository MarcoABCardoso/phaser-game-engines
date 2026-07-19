# Releasing

Prereleases are prepared in Git, staged from GitHub Actions through npm trusted
publishing, approved by a maintainer with 2FA, and verified from the public
registry. The workflow does not use a long-lived npm publishing token.

## One-time npm setup

Configure the same GitHub Actions trusted publisher on both
`@phaser-game-engines/toolkit` and `@phaser-game-engines/create-game`:

- GitHub user or organization: `MarcoABCardoso`
- repository: `phaser-game-engines`
- workflow filename: `release.yml`
- environment: `npm`
- allowed action: `npm stage publish`

The npm account approving staged releases must have 2FA enabled. The repository
must also have a GitHub environment named `npm`; protection rules may require a
maintainer to approve the staging job.

## Prepare a version

1. Add user-facing changes and migrations under `Unreleased` in
   `CHANGELOG.md`.
2. Run `npm run prepare:release -- <version>`. This aligns the root, toolkit,
   generator, and lockfile versions and promotes `Unreleased` into a dated
   changelog section.
3. Run `npm run check:release`, `npm ci`, and `npm run verify`.
4. Commit and push the prepared version. Do not continue until CI succeeds on
   Node 20.19, 22, and 24.

## Stage, approve, and verify

1. Run the **Stage npm release** workflow with the exact committed version and
   the `next` tag. It re-verifies the repository, inspects both tarballs, and
   stages both packages using OIDC. GitHub-hosted trusted publishing adds npm
   provenance automatically.
2. Confirm that both packages appear in npm's **Staged Packages** view. Download
   or inspect either candidate before approval when needed.
3. Approve both staged packages on npm with 2FA. Never approve only one package
   unless the other package is already staged and ready for approval.
4. Run the **Verify npm release** workflow with the exact published version. It
   installs both registry packages, checks public exports and CLI shims, then
   builds and tests every supported generated starter variant.
5. Create a signed `v<version>` Git tag and GitHub release containing the
   matching changelog section only after the registry workflow passes.

If staging fails after one candidate was created, leave it unavailable, fix the
cause, and rerun or reject the staged candidate. A staged package is not public
until a maintainer approves it.

Do not run `npm publish` directly for routine releases and do not release from a
working tree with uncommitted changes.
