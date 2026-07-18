/** @typedef {{ id: string, mechanics?: Array<Function|{install: Function}>, policies?: Record<string, Function|{install: Function}>, entityTypes?: Record<string, Function>, owns?: string[], conflicts?: string[] }} Recipe */
export type Recipe = {
    id: string;
    mechanics?: Array<Function | {
        install: Function;
    }>;
    policies?: Record<string, Function | {
        install: Function;
    }>;
    entityTypes?: Record<string, Function>;
    owns?: string[];
    conflicts?: string[];
};
/**
 * Validate and combine opt-in game recipes before a scene creates any resources.
 * `owns` names exclusive host responsibilities (for example `player.health`), while
 * `conflicts` names recipes that must not be installed together.
 *
 * @param {Recipe[]} recipes
 */
export declare function composeRecipes(recipes?: Recipe[]): Readonly<{
    ids: readonly any[];
    mechanics: readonly (Function | {
        install: Function;
    })[];
    entityTypes: Readonly<{}>;
    ownership: any;
}>;
/** Define a recipe while preserving its useful literal shape for editor tooling. */
export declare function defineRecipe(recipe: any): any;
/** Replace one named recipe policy without copying or subclassing the recipe. */
export declare function replaceRecipePolicy(recipe: any, name: any, replacement: any): any;
