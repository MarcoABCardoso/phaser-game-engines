import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const packageDirectories = ['toolkit', 'create-game'];
const rootManifest = {
  path: join(root, 'package.json'),
  value: JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')),
};
const packageManifests = packageDirectories.map((directory) => {
  const path = join(root, 'packages', directory, 'package.json');
  return { path, value: JSON.parse(readFileSync(path, 'utf8')) };
});
const manifests = [rootManifest, ...packageManifests];
const requestedVersion = process.argv[2];

if (requestedVersion === '--check') {
  const versions = new Set(manifests.map(({ value }) => value.version));
  if (versions.size !== 1) fail(`Workspace manifest versions differ: ${[...versions].join(', ')}`);
  const [version] = versions;
  for (const { value } of manifests) {
    for (const [name, range] of Object.entries(value.dependencies ?? {})) {
      if (name.startsWith('@phaser-game-engines/') && range !== version) {
        fail(`${value.name} depends on ${name}@${range}; expected ${version}.`);
      }
    }
  }
  console.log(`Root and publishable package versions are aligned at ${version}.`);
  process.exit(0);
}

if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(requestedVersion ?? '')) {
  fail('Usage: npm run version:packages -- <semver>');
}

for (const manifest of manifests) {
  manifest.value.version = requestedVersion;
  for (const name of Object.keys(manifest.value.dependencies ?? {})) {
    if (name.startsWith('@phaser-game-engines/')) {
      manifest.value.dependencies[name] = requestedVersion;
    }
  }
  writeFileSync(manifest.path, `${JSON.stringify(manifest.value, null, 2)}\n`);
}

const npmCli = process.env.npm_execpath;
if (!npmCli) fail('npm_execpath is required to update package-lock.json.');
const lock = spawnSync(process.execPath, [
  npmCli, 'install', '--package-lock-only', '--ignore-scripts', '--offline',
], { cwd: root, encoding: 'utf8' });
if (lock.status !== 0) fail(lock.stderr || lock.stdout || 'Could not update package-lock.json.');
console.log(`Updated the root and all publishable packages to ${requestedVersion}.`);

function fail(message) {
  console.error(message);
  process.exit(1);
}
