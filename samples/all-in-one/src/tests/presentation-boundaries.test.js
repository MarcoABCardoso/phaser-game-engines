import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const sceneFiles = ['EncounterScene.js', 'InventoryScene.js', 'WorldScene.js'];

describe('all-in-one presentation boundaries', () => {
  it.each(sceneFiles)('keeps Phaser object construction out of %s', (file) => {
    const source = readFileSync(new URL(`../scenes/${file}`, import.meta.url), 'utf8');
    expect(source).not.toMatch(/\b(?:this|scene)\.add\./);
  });

  it('uses only the normalized presentation-handle API from InventoryScene', () => {
    const source = readFileSync(new URL('../scenes/InventoryScene.js', import.meta.url), 'utf8');
    expect(source).not.toMatch(/inventoryShell\.(?!update\b|destroy\b|root\b|body\b|active\b)/);
  });
});
