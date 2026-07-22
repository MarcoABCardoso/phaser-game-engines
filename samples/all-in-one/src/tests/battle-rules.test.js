import { expect, test } from 'vitest';
import { Battle } from '@phaser-game-engines/toolkit/battle/headless';
import { battleRules } from '../rules/battle-rules.js';

test('all-in-one battle rules finish independently of Phaser', () => {
  const battle = new Battle({ playerResolve: 5, rivalResolve: 2 }, { rules: battleRules });
  battle.start();
  battle.submitCommand({ id: 'focus', actorId: 'player' });
  expect(battle.state.machine.outcome).toEqual({ kind: 'won' });
});
