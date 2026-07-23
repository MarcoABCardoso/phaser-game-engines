import { readFileSync } from 'node:fs';
import { convertTiledMap } from '@phaser-game-engines/toolkit/content/tiled';
import { expect, test } from 'vitest';

const customTypes = ['area-portal', 'battle-encounter', 'collectible', 'guide', 'strategist'];

function readMap(name) {
  return JSON.parse(readFileSync(new URL(`../../public/maps/${name}.json`, import.meta.url), 'utf8'));
}

test.each(['camp', 'grove'])('%s Tiled object roles convert into a validated top-down level', (name) => {
  const map = readMap(name);
  const level = convertTiledMap(map, {
    kind: 'top-down',
    path: `maps/${name}.json`,
    types: customTypes,
  });
  expect(level.world).toEqual({ width: 960, height: 544 });
  expect(level.entitySpecs.some((entity) => entity.type === 'area-portal')).toBe(true);
  expect(level.walls.length).toBeGreaterThan(0);
});
