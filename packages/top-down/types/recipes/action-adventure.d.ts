import Enemy from '../entities/Enemy.js';
import Pickup from '../entities/Pickup.js';
export declare const ACTION_ADVENTURE_ENTITY_TYPES: Readonly<{
    enemy: typeof Enemy;
    pickup: typeof Pickup;
}>;
export type ActionAdventureOptions = {
    maxHealth?: number;
    attackCooldownMs?: number;
    attackDamage?: number;
    invulnerableMs?: number;
    attackAction?: string;
    save?: {
        flags?: Record<string, boolean>;
        inventory?: Record<string, number>;
    };
    onAttack?: Function;
    onCollect?: Function;
    onPlayerDefeated?: Function;
    onEnemyDefeated?: Function;
    onRemove?: Function;
    statusText?: Function;
};
/** Compose the action-adventure entities and mechanic as one explicit scene recipe. */
export declare function createActionAdventureRecipe(options?: {}): any;
/** Validate the serializable action-adventure options shared with its JSON Schema.
 * @param {ActionAdventureOptions} options
 */
export declare function validateActionAdventureOptions(options?: ActionAdventureOptions, { path }?: {
    path?: string | undefined;
}): ActionAdventureOptions;
