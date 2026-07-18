import { WorldEntity } from '@phaser-game-engines/core';
/** Platformer extension point over the shared headless world entity contract. */
export default class Entity extends WorldEntity {
    onBanked(): void;
}
