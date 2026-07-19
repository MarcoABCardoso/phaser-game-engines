import { readFileSync } from 'node:fs';

const requestedVersion = process.argv[2];
const rootManifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

if (requestedVersion !== rootManifest.version) {
  throw new Error(
    `Workflow requested ${JSON.stringify(requestedVersion)}, but the committed version is ${rootManifest.version}.`,
  );
}

console.log(`Release workflow matches committed version ${requestedVersion}.`);
