import { expect, test } from 'vitest';
import { validatePlatformerLevel } from '@phaser-game-engines/toolkit/platformer/headless';
import { level } from '../content/level.js';
import { getStageOutcome } from '../rules/game-rules.js';

test('content is valid without Phaser', () => {
  expect(() => validatePlatformerLevel(level, { types: { 'signal-goal': class {} } })).not.toThrow();
});

test('game-owned rules decide whether the stage is complete', () => {
  const goal = { x: 50, y: 50 };
  expect(getStageOutcome({ player: { x: 10, y: 10 }, goal })).toBeNull();
  expect(getStageOutcome({ player: { x: 50, y: 50 }, goal })).toEqual({ kind: 'won' });
});
