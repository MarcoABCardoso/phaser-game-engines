import { describe, expect, it } from 'vitest';
import { validateActionAdventureOptions } from '@phaser-game-engines/toolkit/top-down/headless';

describe('action-adventure recipe configuration', () => {
  it('validates serializable options without Phaser', () => {
    const options = { maxHealth: 8, attackCooldownMs: 200, attackDamage: 2, attackAction: 'primary' };
    expect(validateActionAdventureOptions(options)).toBe(options);
  });

  it('reports the exact invalid option path', () => {
    expect(() => validateActionAdventureOptions({ invulnerableMs: -1 }, { path: 'recipes.action' }))
      .toThrow('recipes.action.invulnerableMs');
  });
});
