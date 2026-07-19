import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { migrateContentFile, validateContentFile } from '../src/index.js';

const temporaryDirectories = [];
afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

describe('content tools', () => {
  it('validates files with built-in and declared game-owned types', () => {
    const file = fixture({
      world: { width: 320, height: 180 }, spawn: { x: 20, y: 20 }, walls: [],
      entitySpecs: [{ type: 'questMarker', id: 'goal' }],
    });
    expect(validateContentFile(file, { kind: 'top-down', types: ['questMarker'] }).world.width).toBe(320);
  });

  it('reports the filename and exact property path', () => {
    const file = fixture({
      world: { width: 320, height: 180 }, spawn: { x: 20, y: 20 },
      floorSegments: [{ x: 0, y: 160, w: -1, h: 20 }], entitySpecs: [],
    });
    expect(() => validateContentFile(file, { kind: 'platformer' }))
      .toThrow(`${file}.floorSegments[0].w`);
  });

  it('previews migrations without writing and writes only when requested', () => {
    const original = { world: { width: 1, height: 1 }, spawn: { x: 0, y: 0 }, entitySpecs: [{ type: 'custom' }] };
    const file = fixture(original);
    const preview = migrateContentFile(file);
    expect(preview.changed).toBe(true);
    expect(preview.written).toBe(false);
    expect(JSON.parse(readFileSync(file, 'utf8'))).toEqual(original);
    expect(migrateContentFile(file, { write: true }).written).toBe(true);
    expect(JSON.parse(readFileSync(file, 'utf8'))).toMatchObject({ schemaVersion: 1, entitySpecs: [{ schemaVersion: 1 }] });
  });

  it('CLI diagnostics are suitable for CI output', () => {
    const file = fixture({ world: { width: 0, height: 10 }, spawn: { x: 0, y: 0 } });
    const result = spawnSync(process.execPath, [
      fileURLToPath(new URL('../bin/pge-content.js', import.meta.url)),
      'validate', file, '--kind', 'world',
    ], { encoding: 'utf8' });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(`${file}.world.width`);
  });
});

function fixture(value) {
  const directory = mkdtempSync(join(tmpdir(), 'pge-content-'));
  temporaryDirectories.push(directory);
  const file = join(directory, 'level.json');
  writeFileSync(file, JSON.stringify(value));
  return file;
}
