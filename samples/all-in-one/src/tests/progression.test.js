import { expect, test } from 'vitest';
import { createProgressionState, grantFieldTrialReward } from '../rules/progression.js';
import { chooseStrategy, strategyBonuses } from '../rules/strategist.js';

test('the strategist choice is permanent and changes one battle statistic', () => {
  expect(chooseStrategy(null, 'power')).toBe('power');
  expect(chooseStrategy('power', 'guard')).toBe('power');
  expect(strategyBonuses('power')).toEqual({ attack: 1, defense: 0 });
  expect(strategyBonuses('guard')).toEqual({ attack: 0, defense: 1 });
});

test('the field-trial reward advances the character exactly once', () => {
  const player = { hp: 3, maxHp: 12, attack: 3, defense: 1 };
  const reward = grantFieldTrialReward(player, createProgressionState());
  expect(reward).toMatchObject({
    player: { hp: 14, maxHp: 14, attack: 4 },
    progression: { level: 2, skillPoints: 1 },
    credits: 25,
  });
  expect(grantFieldTrialReward(reward.player, reward.progression).credits).toBe(0);
});
