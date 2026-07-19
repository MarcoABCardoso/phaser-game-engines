import Barricade from '../entities/Barricade.js';
import DialogTrigger from '../entities/DialogTrigger.js';
import Gate from '../entities/Gate.js';
import Sign from '../entities/Sign.js';
export declare const ACTION_PLATFORMER_ENTITY_TYPES: Readonly<{
    barricade: typeof Barricade;
    sign: typeof Sign;
    dialogTrigger: typeof DialogTrigger;
    gate: typeof Gate;
}>;
/** A composed starting point for games that need health, melee, dialogue, and checkpoints. */
export declare function createActionPlatformerRecipe(options?: {}): any;
