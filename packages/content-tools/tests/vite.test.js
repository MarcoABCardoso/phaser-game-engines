import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createContentValidationPlugin } from '../src/vite.js';

const directories = [];
afterEach(() => directories.splice(0).forEach((directory) => rmSync(directory, { recursive: true, force: true })));

describe('Vite content validation plugin', () => {
  it('validates builds and preserves exact paths during hot updates', () => {
    const directory = mkdtempSync(join(tmpdir(), 'pge-vite-content-'));
    directories.push(directory);
    const file = join(directory, 'level.json');
    writeFileSync(file, JSON.stringify({ world: { width: 10, height: 10 }, spawn: { x: 0, y: 0 } }));
    const plugin = createContentValidationPlugin({ files: [{ file, kind: 'world' }] });
    expect(() => plugin.buildStart()).not.toThrow();
    writeFileSync(file, JSON.stringify({ world: { width: 0, height: 10 }, spawn: { x: 0, y: 0 } }));
    expect(() => plugin.handleHotUpdate({ file, modules: [] })).toThrow(`${file}.world.width`);
  });
});
