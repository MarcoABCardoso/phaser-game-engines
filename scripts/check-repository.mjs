import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const rootPackage = readJson(join(root, 'package.json'));
const failures = [];

for (const document of ['README.md', 'CONTRIBUTING.md', 'RELEASING.md']) {
  const path = join(root, document);
  if (!existsSync(path)) continue;
  const contents = readFileSync(path, 'utf8');
  for (const match of contents.matchAll(/npm run ([\w:-]+)/g)) {
    if (!rootPackage.scripts?.[match[1]]) {
      failures.push(`${document}: npm script ${JSON.stringify(match[1])} does not exist.`);
    }
  }
}

for (const { directory, requiredExports } of [
  {
    directory: 'toolkit',
    requiredExports: [
      './core/headless',
      './platformer',
      './platformer/headless',
      './top-down',
      './top-down/headless',
      './battle',
      './battle/headless',
      './inventory',
      './inventory/headless',
      './content',
      './content/tiled',
      './content/vite',
    ],
  },
  { directory: 'create-game', requiredExports: [] },
]) {
  const packagePath = join(root, 'packages', directory, 'package.json');
  const manifest = readJson(packagePath);
  for (const field of ['name', 'version', 'description', 'homepage', 'bugs', 'repository', 'engines']) {
    if (!manifest[field]) failures.push(`${manifest.name ?? directory}: missing ${field} metadata.`);
  }
  if (manifest.private) failures.push(`${manifest.name}: publishable package cannot be private.`);
  if (!manifest.exports?.['.']) failures.push(`${manifest.name}: missing root export.`);
  for (const specifier of requiredExports) {
    if (!manifest.exports?.[specifier]) failures.push(`${manifest.name}: missing ${specifier} export.`);
  }
  verifyExportTargets(manifest, dirname(packagePath));
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Repository metadata and documented npm commands are consistent.');
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function verifyExportTargets(manifest, packageDirectory) {
  for (const [specifier, definition] of Object.entries(manifest.exports ?? {})) {
    const targets = typeof definition === 'string' ? { default: definition } : definition;
    for (const [condition, target] of Object.entries(targets)) {
      if (typeof target !== 'string') continue;
      if (!target.includes('*')) {
        if (!existsSync(join(packageDirectory, target))) {
          failures.push(`${manifest.name} ${specifier} (${condition}): missing ${target}.`);
        }
        continue;
      }

      if (condition !== 'types') continue;
      const runtimePattern = targets.default;
      if (typeof runtimePattern !== 'string' || !runtimePattern.includes('*')) continue;
      const [runtimePrefix, runtimeSuffix] = runtimePattern.split('*');
      const [typePrefix, typeSuffix] = target.split('*');
      const runtimeDirectory = runtimePrefix.endsWith('/')
        ? runtimePrefix.slice(0, -1)
        : dirname(runtimePrefix);
      const runtimeBase = join(packageDirectory, runtimeDirectory);
      if (!existsSync(runtimeBase)) continue;
      for (const entry of readdirSync(runtimeBase, { withFileTypes: true })) {
        if (!entry.isFile()) continue;
        const relativeRuntime = `${runtimePrefix.slice(0, runtimePrefix.lastIndexOf('/') + 1)}${entry.name}`;
        if (!relativeRuntime.startsWith(runtimePrefix) || !relativeRuntime.endsWith(runtimeSuffix)) continue;
        const capture = relativeRuntime.slice(runtimePrefix.length, relativeRuntime.length - runtimeSuffix.length);
        const typeTarget = `${typePrefix}${capture}${typeSuffix}`;
        if (!existsSync(join(packageDirectory, typeTarget))) {
          failures.push(`${manifest.name} ${specifier}: ${relativeRuntime} has no ${typeTarget}.`);
        }
      }
    }
  }
}
