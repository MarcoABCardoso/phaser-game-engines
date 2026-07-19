import { describe, expect, it } from 'vitest';
import { composeRecipes, defineRecipe, replaceRecipePolicy } from '../src/recipes.js';

describe('recipe composition', () => {
  it('combines mechanics and entity types in declaration order', () => {
    const first = () => {};
    const second = () => {};
    class Portal {}
    const result = composeRecipes([
      defineRecipe({ id: 'movement', mechanics: [first], owns: ['player.motion'] }),
      defineRecipe({ id: 'world', mechanics: [second], entityTypes: { portal: Portal } }),
    ]);

    expect(result.ids).toEqual(['movement', 'world']);
    expect(result.mechanics).toEqual([first, second]);
    expect(result.entityTypes.portal).toBe(Portal);
    expect(result.ownership).toEqual({ 'player.motion': 'movement' });
  });

  it('rejects duplicate recipes, explicit conflicts, and ambiguous ownership', () => {
    expect(() => composeRecipes([{ id: 'a' }, { id: 'a' }])).toThrow(/more than once/);
    expect(() => composeRecipes([{ id: 'a', conflicts: ['b'] }, { id: 'b' }])).toThrow(/conflicts/);
    expect(() => composeRecipes([
      { id: 'a', owns: ['player.health'] },
      { id: 'b', owns: ['player.health'] },
    ])).toThrow(/both own/);
  });

  it('permits two recipes to share the same entity implementation only', () => {
    class Shared {}
    expect(composeRecipes([
      { id: 'a', entityTypes: { shared: Shared } },
      { id: 'b', entityTypes: { shared: Shared } },
    ]).entityTypes.shared).toBe(Shared);
    expect(() => composeRecipes([
      { id: 'a', entityTypes: { shared: Shared } },
      { id: 'b', entityTypes: { shared: class Different {} } },
    ])).toThrow(/different/);
  });

  it('replaces one named policy without mutating the source recipe', () => {
    const original = () => {};
    const replacement = () => {};
    const recipe = defineRecipe({ id: 'action', policies: { health: original } });
    const customized = replaceRecipePolicy(recipe, 'health', replacement);
    expect(recipe.policies.health).toBe(original);
    expect(composeRecipes([customized]).mechanics).toEqual([replacement]);
  });
});
