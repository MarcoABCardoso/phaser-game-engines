import { describe, expect, it } from 'vitest';
import Battle from '../src/systems/BattleController.js';

const rules = {
  createInitialState: () => ({ actors: [{ id: 'a', energy: 2 }, { id: 'b', energy: 2 }], log: [] }),
  getTurnOrder: () => ['a', 'b'],
  getAvailableCommands: (state, actorId) => [{ id: 'wait', actorId }],
  validateCommand: (state, command, commands) => commands.some((entry) => entry.id === command.id && entry.actorId === command.actorId),
  resolveCommand: (state, command) => ({ changes: [{ type: 'increment', path: ['actors', state.actors.findIndex((actor) => actor.id === command.actorId), 'energy'], value: -1 }], events: [{ type: 'actionResolved', detail: { command } }] }),
  getOutcome: (state) => state.actors.every((actor) => actor.energy <= 0) ? { kind: 'done' } : null,
};

describe('generic battle state machine', () => {
  it('owns phase progression without assuming combat fields', () => { const battle = new Battle({ any: 'game data' }, { rules }); battle.start(); expect(battle.state.machine.phase).toBe('command-selection'); expect(battle.state.machine.activeId).toBe('a'); expect(battle.state.game.actors[0].energy).toBe(2); });
  it('takes a rules transaction and emits its domain event', () => { const events = []; const battle = new Battle({}, { rules, emit: (type) => events.push(type) }); battle.start(); battle.submitCommand({ id: 'wait', actorId: 'a' }); expect(battle.state.game.actors[0].energy).toBe(1); expect(events).toContain('stateChanged'); expect(events).toContain('actionResolved'); });
  it('rejects a command when it is not submitted by the active participant', () => { const battle = new Battle({}, { rules }); battle.start(); expect(() => battle.submitCommand({ id: 'wait', actorId: 'b' })).toThrow('active participant'); });
  it('allows game-specific terminal conditions', () => { const quickRules = { ...rules, resolveCommand: () => ({ state: { actors: [{ id: 'a', energy: 0 }, { id: 'b', energy: 0 }], log: [] } }) }; const battle = new Battle({}, { rules: quickRules }); battle.start(); battle.submitCommand({ id: 'wait', actorId: 'a' }); expect(battle.state.machine.phase).toBe('finished'); expect(battle.state.machine.outcome).toEqual({ kind: 'done' }); });
});
