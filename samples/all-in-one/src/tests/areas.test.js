import { expect, test } from 'vitest';
import { areas, getEncounter, resolveAreaEntry } from '../content/areas.js';

test('the two-area route uses named entries in both directions', () => {
  expect(Object.keys(areas)).toEqual(['camp', 'grove']);
  expect(resolveAreaEntry('grove', 'from-camp')).toEqual({ x: 110, y: 270 });
  expect(resolveAreaEntry('camp', 'from-grove')).toEqual({ x: 845, y: 270 });
});

test('Tiled encounter records resolve into game-owned battle content', () => {
  expect(getEncounter('training-drone').enemies).toHaveLength(2);
});
