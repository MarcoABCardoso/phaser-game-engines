import tiledMap from './level.tmj.json';
import { convertTiledMap } from '@phaser-game-engines/toolkit/content/tiled';

export const basicLevel = convertTiledMap(tiledMap, {
  kind: 'platformer',
  path: 'samples/basic-platformer/level.tmj.json',
});
