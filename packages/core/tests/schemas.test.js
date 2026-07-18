import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const schemas = [
  'packages/core/schemas/world.schema.json',
  'packages/core/schemas/portal.schema.json',
  'packages/core/schemas/assets.schema.json',
  'packages/platformer/schemas/level.schema.json',
  'packages/top-down/schemas/level.schema.json',
  'packages/top-down/schemas/action-adventure.schema.json',
];

describe('published JSON Schemas', () => {
  it.each(schemas)('%s is a draft 2020-12 schema with a stable identifier', (path) => {
    const schema = JSON.parse(readFileSync(path, 'utf8'));
    expect(schema.$schema).toBe('https://json-schema.org/draft/2020-12/schema');
    expect(schema.$id).toMatch(/^https:\/\/phaser-game-engines\.dev\/schemas\//);
    expect(schema.title).toBeTruthy();
  });
});
