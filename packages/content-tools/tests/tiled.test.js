import { describe, expect, it } from 'vitest';
import { convertTiledMap } from '../src/tiled.js';

const base = {
  width: 20, height: 10, tilewidth: 32, tileheight: 32,
  layers: [
    { name: 'ignored-name', type: 'objectgroup', properties: [{ name: 'engineRole', value: 'spawn' }], objects: [{ x: 32, y: 64 }] },
    { name: 'solids', type: 'objectgroup', objects: [{ x: 0, y: 288, width: 640, height: 32 }] },
    { name: 'entities', type: 'objectgroup', objects: [] },
  ],
};

describe('Tiled object-layer adapter', () => {
  it('converts and validates a platformer map', () => {
    const map = structuredClone(base);
    map.layers.push({ name: 'platforms', type: 'objectgroup', objects: [{ name: 'thin', x: 200, y: 220, width: 100, height: 12, properties: [{ name: 'kind', value: 'thin' }] }] });
    const level = convertTiledMap(map, { kind: 'platformer' });
    expect(level.world).toEqual({ width: 640, height: 320 });
    expect(level.platforms[0]).toMatchObject({ id: 'thin', kind: 'thin', w: 100 });
  });
  it('maps entity properties, zones, and portal entry points for top-down', () => {
    const map = structuredClone(base);
    map.layers[2].objects.push({ name: 'exit', class: 'portal', x: 580, y: 120, width: 40, height: 80, properties: [{ name: 'to', value: 'next' }, { name: 'entryX', value: 20 }, { name: 'entryY', value: 30 }] });
    const level = convertTiledMap(map, { kind: 'top-down' });
    expect(level.entitySpecs[0]).toMatchObject({ type: 'portal', id: 'exit', to: 'next', entry: { x: 20, y: 30 }, zone: { w: 40, h: 80 } });
  });
  it('reports the exact Tiled source path before runtime conversion', () => {
    const map = structuredClone(base);
    map.layers[1].objects[0].width = 0;
    expect(() => convertTiledMap(map, { kind: 'platformer', path: 'maps/cave.tmj' })).toThrow('maps/cave.tmj.layers[1].objects[0].width');
  });
});
