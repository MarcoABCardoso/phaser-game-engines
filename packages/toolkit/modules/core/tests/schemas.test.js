import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const schemas = [
  new URL('../schemas/world.schema.json', import.meta.url),
  new URL('../schemas/portal.schema.json', import.meta.url),
  new URL('../schemas/assets.schema.json', import.meta.url),
  new URL('../../platformer/schemas/level.schema.json', import.meta.url),
  new URL('../../top-down/schemas/level.schema.json', import.meta.url),
  new URL('../../top-down/schemas/action-adventure.schema.json', import.meta.url),
];

describe('published JSON Schemas', () => {
  it.each(schemas)('%s is a draft 2020-12 schema with a stable identifier', (path) => {
    const schema = JSON.parse(readFileSync(path, 'utf8'));
    expect(schema.$schema).toBe('https://json-schema.org/draft/2020-12/schema');
    expect(schema.$id).toMatch(/^https:\/\/phaser-game-engines\.dev\/schemas\//);
    expect(schema.title).toBeTruthy();
  });
});
