import {
  cpSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createProject } from '../packages/create-game/src/index.js';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const samplesRoot = join(root, 'samples');
const check = process.argv.includes('--check');
const stagingRoot = mkdtempSync(join(tmpdir(), 'phaser-generator-samples-'));
const samples = [
  { directory: 'basic-platformer', genre: 'platformer' },
  { directory: 'basic-top-down', genre: 'top-down' },
  { directory: 'basic-turn-based-battle', genre: 'battle' },
];

try {
  const differences = [];
  for (const sample of samples) {
    const generated = join(stagingRoot, sample.directory);
    const destination = resolve(samplesRoot, sample.directory);
    if (dirname(destination) !== resolve(samplesRoot)) {
      throw new Error(`Refusing to sync outside the samples directory: ${destination}`);
    }

    createProject({
      targetDirectory: generated,
      genre: sample.genre,
      template: 'recommended',
      input: 'keyboard',
    });
    configureWorkspaceSample(generated);

    if (check) {
      differences.push(...compareDirectories(generated, destination)
        .map((file) => `${sample.directory}/${file}`));
      continue;
    }

    rmSync(destination, { recursive: true, force: true });
    cpSync(generated, destination, { recursive: true });
    console.log(`Synced ${sample.directory} from the recommended ${sample.genre} generator with local toolkit development overrides.`);
  }

  if (differences.length) {
    console.error('Generated samples are out of date:');
    for (const file of differences) console.error(`- ${file}`);
    console.error('Run npm run sync:samples to update them.');
    process.exitCode = 1;
  } else if (check) {
    console.log('Basic samples match the recommended generator output with local toolkit development overrides.');
  }
} finally {
  rmSync(stagingRoot, { recursive: true, force: true });
}

function compareDirectories(expectedRoot, actualRoot) {
  const expected = filesIn(expectedRoot);
  const actual = filesIn(actualRoot);
  const names = new Set([...expected, ...actual]);
  return [...names].filter((name) => {
    const expectedPath = join(expectedRoot, name);
    const actualPath = join(actualRoot, name);
    return !existsSync(expectedPath)
      || !existsSync(actualPath)
      || !readFileSync(expectedPath).equals(readFileSync(actualPath));
  }).sort();
}

function filesIn(directory, prefix = '') {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (!prefix && ['dist', 'node_modules'].includes(entry.name)) return [];
    const absolute = join(directory, entry.name);
    const name = join(prefix, entry.name);
    return entry.isDirectory() ? filesIn(absolute, name) : [relative('.', name)];
  });
}

function configureWorkspaceSample(directory) {
  const manifestPath = join(directory, 'package.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  manifest.dependencies['@phaser-game-engines/toolkit'] = 'file:../../packages/toolkit';
  manifest.scripts.dev = 'vite --force';
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}
