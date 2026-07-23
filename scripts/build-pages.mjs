import { cpSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { build } from 'vite';

const root = resolve(import.meta.dirname, '..');
const sampleRoot = resolve(root, 'samples/all-in-one');
const docsRoot = resolve(root, 'docs');

await build({ root: sampleRoot, base: './' });
await build({ root: docsRoot });
mkdirSync(resolve(docsRoot, 'dist/all-in-one'), { recursive: true });
cpSync(resolve(sampleRoot, 'dist'), resolve(docsRoot, 'dist/all-in-one'), { recursive: true });

console.log('Built documentation and embedded the all-in-one RPG slice at /all-in-one/.');
