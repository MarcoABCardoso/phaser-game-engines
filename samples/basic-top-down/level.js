import tiledMap from './level.tmj.json';
import { convertTiledMap } from '@phaser-game-engines/content-tools/tiled';

export const basicTopDownLevel = convertTiledMap(tiledMap, {
  kind: 'top-down',
  path: 'samples/basic-top-down/level.tmj.json',
  types: ['pickup', 'enemy'],
});
