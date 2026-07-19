import { WorldEntity } from '@phaser-game-engines/toolkit/core';

/** Platformer extension point over the shared headless world entity contract. */
export default class Entity extends WorldEntity {
  onBanked(/* scene */) {}
}
