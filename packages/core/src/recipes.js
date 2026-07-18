/** @typedef {{ id: string, mechanics?: Array<Function|{install: Function}>, policies?: Record<string, Function|{install: Function}>, entityTypes?: Record<string, Function>, owns?: string[], conflicts?: string[] }} Recipe */

/**
 * Validate and combine opt-in game recipes before a scene creates any resources.
 * `owns` names exclusive host responsibilities (for example `player.health`), while
 * `conflicts` names recipes that must not be installed together.
 *
 * @param {Recipe[]} recipes
 */
export function composeRecipes(recipes = []) {
  if (!Array.isArray(recipes)) throw new TypeError('Recipes must be an array.');

  const ids = new Set();
  const owners = new Map();
  const entityOwners = new Map();
  const mechanics = [];
  const entityTypes = {};

  for (const recipe of recipes) {
    if (!recipe || typeof recipe !== 'object' || Array.isArray(recipe)) {
      throw new TypeError('Each recipe must be an object.');
    }
    if (typeof recipe.id !== 'string' || !recipe.id.trim()) {
      throw new TypeError('Each recipe requires a non-empty id.');
    }
    if (ids.has(recipe.id)) throw new Error(`Recipe "${recipe.id}" is installed more than once.`);
    ids.add(recipe.id);
  }

  for (const recipe of recipes) {
    for (const conflict of recipe.conflicts ?? []) {
      if (ids.has(conflict)) {
        throw new Error(`Recipe "${recipe.id}" conflicts with "${conflict}".`);
      }
    }
    for (const claim of recipe.owns ?? []) {
      if (typeof claim !== 'string' || !claim) {
        throw new TypeError(`Recipe "${recipe.id}" has an invalid ownership claim.`);
      }
      const owner = owners.get(claim);
      if (owner) {
        throw new Error(`Recipes "${owner}" and "${recipe.id}" both own "${claim}".`);
      }
      owners.set(claim, recipe.id);
    }
    if (recipe.mechanics !== undefined && !Array.isArray(recipe.mechanics)) {
      throw new TypeError(`Recipe "${recipe.id}" mechanics must be an array.`);
    }
    mechanics.push(...(recipe.mechanics ?? []), ...Object.values(recipe.policies ?? {}));

    for (const [type, EntityType] of Object.entries(recipe.entityTypes ?? {})) {
      const owner = entityOwners.get(type);
      if (owner && entityTypes[type] !== EntityType) {
        throw new Error(`Recipes "${owner}" and "${recipe.id}" define different "${type}" entities.`);
      }
      entityTypes[type] = EntityType;
      entityOwners.set(type, owner ?? recipe.id);
    }
  }

  return Object.freeze({
    ids: Object.freeze([...ids]),
    mechanics: Object.freeze(mechanics),
    entityTypes: Object.freeze(entityTypes),
    ownership: Object.freeze(Object.fromEntries(owners)),
  });
}

/** Define a recipe while preserving its useful literal shape for editor tooling. */
export function defineRecipe(recipe) {
  composeRecipes([recipe]);
  return Object.freeze({
    ...recipe,
    mechanics: Object.freeze([...(recipe.mechanics ?? [])]),
    policies: Object.freeze({ ...(recipe.policies ?? {}) }),
    entityTypes: Object.freeze({ ...(recipe.entityTypes ?? {}) }),
    owns: Object.freeze([...(recipe.owns ?? [])]),
    conflicts: Object.freeze([...(recipe.conflicts ?? [])]),
  });
}

/** Replace one named recipe policy without copying or subclassing the recipe. */
export function replaceRecipePolicy(recipe, name, replacement) {
  if (!Object.hasOwn(recipe?.policies ?? {}, name)) {
    throw new Error(`Recipe "${recipe?.id ?? '<unknown>'}" has no "${name}" policy.`);
  }
  return defineRecipe({
    ...recipe,
    policies: { ...recipe.policies, [name]: replacement },
  });
}
