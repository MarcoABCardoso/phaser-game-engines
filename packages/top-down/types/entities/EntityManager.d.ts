import { EntityStore } from '@phaser-game-engines/core';
/** Compatibility name for the shared world entity store. */
export default class EntityManager extends EntityStore {
    constructor(types?: {
        portal: typeof import("./Portal.js").default;
        interactable: typeof import("./Interactable.js").default;
        sign: typeof import("./Interactable.js").default;
    });
}
