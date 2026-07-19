import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const requestedVersion = process.argv[2];
if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(requestedVersion ?? '')) {
  fail('Usage: npm run prepare:release -- <semver>');
}

const changelogPath = join(root, 'CHANGELOG.md');
const changelog = readFileSync(changelogPath, 'utf8');
if (new RegExp(`^## \[${escapeRegExp(requestedVersion)}\]`, 'm').test(changelog)) {
  fail(`CHANGELOG.md already contains a ${requestedVersion} release.`);
}

const unreleased = changelog.match(/^## Unreleased\s*\r?\n([\s\S]*?)(?=\r?\n## \[)/m);
if (!unreleased) fail('CHANGELOG.md must contain an Unreleased section before the first versioned section.');
const releaseNotes = unreleased[1].trim();
if (!releaseNotes || releaseNotes === 'No changes yet.') {
  fail('Add user-facing entries to CHANGELOG.md Unreleased before preparing a release.');
}

const npmCli = process.env.npm_execpath;
if (!npmCli) fail('npm_execpath is required to prepare a release.');
const versionResult = spawnSync(process.execPath, [
  npmCli, 'run', 'version:packages', '--', requestedVersion,
], { cwd: root, encoding: 'utf8' });
if (versionResult.status !== 0) fail(versionResult.stderr || versionResult.stdout || 'Version alignment failed.');

const date = new Date().toISOString().slice(0, 10);
const releaseSection = `## Unreleased\n\nNo changes yet.\n\n## [${requestedVersion}] - ${date}\n\n${releaseNotes}`;
writeFileSync(changelogPath, changelog.replace(unreleased[0].trimEnd(), releaseSection));
console.log(`Prepared ${requestedVersion} manifests, lockfile, and changelog section.`);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
