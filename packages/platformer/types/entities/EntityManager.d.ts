import { EntityStore } from '@phaser-game-engines/core';
/** Compatibility name for the shared world entity store. */
export default class EntityManager extends EntityStore {
    constructor(types?: {
        spawner: typeof import("./Spawner.js").default;
        movingPlatform: typeof import("./MovingPlatform.js").default;
        portal: typeof import("./Portal.js").default;
    });
}
