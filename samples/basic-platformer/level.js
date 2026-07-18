import tiledMap from './level.tmj.json';
import { convertTiledMap } from '@phaser-game-engines/content-tools/tiled';

export const basicLevel = convertTiledMap(tiledMap, {
  kind: 'platformer',
  path: 'samples/basic-platformer/level.tmj.json',
});
