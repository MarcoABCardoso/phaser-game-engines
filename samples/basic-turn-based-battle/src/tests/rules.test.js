import { expect, test } from 'vitest';
import { Battle } from '@phaser-game-engines/toolkit/battle/headless';
import { battleSpec } from '../content/level.js';
import { rules } from '../rules/game-rules.js';
test('game-owned rules expose distinct choices and reach a deterministic result', () => { const battle = new Battle(battleSpec, { rules }); battle.start(); expect(battle.availableCommands().map((command) => command.id)).toEqual(['focus', 'overload']); battle.submitCommand({ id: 'overload', actorId: 'player' }); battle.submitCommand({ id: 'focus', actorId: 'rival' }); battle.submitCommand({ id: 'focus', actorId: 'player' }); expect(battle.state.machine.outcome).toEqual({ kind: 'won' }); });
