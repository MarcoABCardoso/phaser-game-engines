import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const packageDirectories = [
  'toolkit',
  'create-game',
];
const rootManifest = readJson(join(root, 'package.json'));
const manifests = packageDirectories.map((directory) => ({
  directory,
  value: readJson(join(root, 'packages', directory, 'package.json')),
}));
const blockers = [];
const notices = [];

const versions = new Set([rootManifest.version, ...manifests.map(({ value }) => value.version)]);
if (versions.size !== 1) {
  blockers.push(`Root and package versions differ: ${[...versions].join(', ')}.`);
}

const [version] = versions;
if (!/^0\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version ?? '')) {
  blockers.push(`Expected a prerelease-era 0.x version; found ${JSON.stringify(version)}.`);
}

const licensePath = ['LICENSE', 'LICENSE.md', 'LICENSE.txt']
  .map((name) => join(root, name))
  .find(existsSync);
if (!licensePath) {
  blockers.push('No repository license exists. The owner must select a license before publication.');
}
const licenseContents = licensePath ? normalizedText(licensePath) : null;

for (const { directory, value } of manifests) {
  if (!value.name?.startsWith('@phaser-game-engines/')) {
    blockers.push(`${directory}: unexpected package name ${JSON.stringify(value.name)}.`);
  }
  if (value.publishConfig?.access !== 'public') {
    blockers.push(`${value.name}: publishConfig.access must be "public".`);
  }
  if (value.version !== version) {
    blockers.push(`${value.name}: version ${value.version} does not match ${version}.`);
  }
  if (licensePath && !value.license) {
    blockers.push(`${value.name}: add the selected SPDX license identifier to package.json.`);
  }
  const packageLicensePath = join(root, 'packages', directory, 'LICENSE');
  if (licenseContents && !existsSync(packageLicensePath)) {
    blockers.push(`${value.name}: package tarball would not contain a LICENSE file.`);
  } else if (licenseContents && normalizedText(packageLicensePath) !== licenseContents) {
    blockers.push(`${value.name}: package LICENSE differs from the repository license.`);
  }
}

const changelog = readFileSync(join(root, 'CHANGELOG.md'), 'utf8');
const escapedVersion = String(version).replaceAll('.', '\\.');
if (!new RegExp(`^## \\[(?:v)?${escapedVersion}\\]`, 'm').test(changelog)) {
  blockers.push(`CHANGELOG.md has no release section for ${version}.`);
}

notices.push('External check: `npm org ls phaser-game-engines` must show the releasing account as an owner or publisher.');
notices.push('Publishing is deliberately not performed by this check.');

console.log(`Release readiness for ${version ?? 'unknown version'}:`);
for (const notice of notices) console.log(`  NOTE: ${notice}`);
for (const blocker of blockers) console.log(`  BLOCKED: ${blocker}`);
if (!blockers.length) console.log('  READY: repository-controlled prerelease checks passed.');
process.exitCode = blockers.length ? 1 : 0;

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function normalizedText(path) {
  return readFileSync(path, 'utf8').replaceAll('\r\n', '\n').trimEnd();
}
