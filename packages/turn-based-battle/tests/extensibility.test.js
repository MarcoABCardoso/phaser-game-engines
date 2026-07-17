import { describe, expect, it } from 'vitest';
import { createManualClock, createSeededRng, createSessionRecorder, replaySession } from '@phaser-game-engines/core';
import Battle from '../src/systems/BattleController.js';

const contestRules = {
  createInitialState: () => ({ momentum: { red: 0, blue: 0 }, speakers: ['red', 'blue'] }),
  getTurnOrder: (state) => state.speakers,
  getAvailableCommands: (state, actorId) => [{ id: 'appeal', actorId }],
  resolveCommand: (state, command, context) => ({
    changes: [{ type: 'increment', path: ['momentum', command.actorId], value: context.rng() < 0.5 ? 1 : 2 }],
  }),
  getOutcome: (state) => Object.entries(state.momentum).find(([, score]) => score >= 3)?.[0] ?? null,
};

describe('phase pipeline and event order', () => {
  it('runs custom phases in a stable lifecycle order', () => {
    const events = [];
    const battle = new Battle({}, {
      rules: { ...contestRules, runPhase: (state, phase) => phase === 'upkeep' ? { events: [{ type: 'upkeepApplied' }] } : null },
      pipeline: [
        { id: 'upkeep', event: 'upkeepStarted' },
        { id: 'command-selection', event: 'commandRequested', pause: 'command' },
        { id: 'resolution', phase: 'resolving', run: 'resolve' },
        { id: 'cleanup', event: 'cleanupStarted' },
      ],
      emit: (type) => events.push(type),
    });
    battle.start();
    battle.submitCommand({ id: 'appeal', actorId: 'red' });
    expect(events).toEqual([
      'phaseChanged', 'battleStarted', 'roundStarted',
      'phaseChanged', 'upkeepStarted', 'upkeepApplied',
      'phaseChanged', 'commandRequested', 'commandSubmitted',
      'phaseChanged', 'beforeResolve', 'stateChanged', 'afterResolve',
      'phaseChanged', 'cleanupStarted',
      'phaseChanged', 'upkeepStarted', 'upkeepApplied',
      'phaseChanged', 'commandRequested',
    ]);
  });

  it('supports multi-stage command selection without prescribing target fields', () => {
    const rules = {
      ...contestRules,
      getCommandStages: () => [
        { id: 'approach', options: ['logic', 'charm'] },
        { id: 'audience', options: ['jury', 'crowd'] },
      ],
      createCommand: (state, draft) => ({ id: 'appeal', actorId: draft.actorId, ...draft.selections }),
    };
    const battle = new Battle({}, { rules });
    battle.start();
    expect(battle.submitSelection('logic')).toBeNull();
    battle.submitSelection('jury');
    expect(battle.state.game.momentum.red).toBeGreaterThan(0);
  });

  it('accepts a custom scheduler and validates advertised command fields by default', () => {
    const scheduler = {
      createSchedule: () => ['blue', 'red'],
      next: (schedule) => schedule.pop() ?? null,
    };
    const battle = new Battle({}, { rules: contestRules, scheduler });
    battle.start();
    expect(battle.state.machine.activeId).toBe('red');
    expect(() => battle.submitCommand({ id: 'missing', actorId: 'red' })).toThrow('not available');
  });
});

describe('reactions, scheduling, effects, and cancellation', () => {
  it('resolves interrupts before reactions and mutates the remaining schedule', () => {
    const resolved = [];
    const rules = {
      createInitialState: () => ({ participants: ['a', 'b', 'c'] }),
      getTurnOrder: (state) => state.participants,
      getAvailableCommands: (state, actorId) => [{ id: 'act', actorId }],
      resolveCommand: (state, command) => {
        resolved.push(command.actorId);
        if (command.actorId !== 'a') return null;
        return {
          interrupts: [{ id: 'interrupt', actorId: 'c' }],
          reactions: [{ id: 'react', actorId: 'b' }],
          schedule: { remove: ['b'], prepend: ['c'] },
        };
      },
      getOutcome: () => null,
    };
    const battle = new Battle({}, { rules });
    battle.start();
    battle.submitCommand({ id: 'act', actorId: 'a' });
    expect(resolved).toEqual(['a', 'c', 'b']);
    expect(battle.state.machine.activeId).toBe('c');
    expect(battle.state.machine.queue).toEqual([]);
  });

  it('pauses presentation on opaque effects and resumes logical progression', () => {
    const events = [];
    const rules = {
      ...contestRules,
      resolveCommand: () => ({ effects: [{ id: 'show-result', payload: { tone: 'bright' } }] }),
    };
    const battle = new Battle({}, { rules, emit: (type) => events.push(type) });
    battle.start();
    battle.submitCommand({ id: 'appeal', actorId: 'red' });
    expect(battle.state.machine.phase).toBe('presentation');
    expect(battle.state.machine.activeId).toBe('red');
    battle.completeEffect();
    expect(battle.state.machine.phase).toBe('command-selection');
    expect(battle.state.machine.activeId).toBe('blue');
    expect(events).toContain('effectRequested');
    expect(events).toContain('effectCompleted');
  });

  it('cancels idempotently and rejects further commands', () => {
    const battle = new Battle({}, { rules: contestRules });
    battle.start();
    expect(battle.cancel({ kind: 'retreat' })).toBe(true);
    expect(battle.cancel()).toBe(false);
    expect(battle.state.machine.phase).toBe('cancelled');
    expect(() => battle.submitCommand({ id: 'appeal', actorId: 'red' })).toThrow('command selection');
  });
});

describe('snapshots and deterministic replay across unrelated schemas', () => {
  it('restores a headless snapshot including RNG and clock state', () => {
    const rng = createSeededRng(99);
    const clock = createManualClock(100);
    const first = new Battle({}, { rules: contestRules, rng, clock });
    first.start();
    first.submitCommand({ id: 'appeal', actorId: 'red' });
    clock.advance(16);
    const snapshot = first.snapshot();
    const expectedNext = rng();

    const restoredRng = createSeededRng(1);
    const restoredClock = createManualClock();
    const restored = new Battle({}, { rules: contestRules, rng: restoredRng, clock: restoredClock, snapshot });
    expect(restored.state).toEqual(first.state);
    expect(restoredClock.now()).toBe(116);
    expect(restoredRng()).toBe(expectedNext);
  });

  it('replays recorded commands to the same logical state with the same seed', () => {
    const recorder = createSessionRecorder();
    const original = new Battle({}, { rules: contestRules, rng: createSeededRng(314), recorder });
    original.start();
    original.submitCommand({ id: 'appeal', actorId: 'red' });
    original.submitCommand({ id: 'appeal', actorId: 'blue' });
    original.submitCommand({ id: 'appeal', actorId: 'red' });

    const replayed = new Battle({}, { rules: contestRules, rng: createSeededRng(314) });
    replayed.start();
    replaySession(recorder.snapshot(), { onBattleCommand: (command) => replayed.submitCommand(command) });
    expect(replayed.state.game).toEqual(original.state.game);
    expect(replayed.state.machine.outcome).toEqual(original.state.machine.outcome);
  });

  it('accepts a PP/type schema with no controller combat assumptions', () => {
    const ppRules = {
      createInitialState: () => ({ creatures: { leaf: { moves: { vine: 2 } }, ember: { moves: { spark: 2 } } }, winner: null }),
      getTurnOrder: () => ['leaf', 'ember'],
      getAvailableCommands: (state, actorId) => Object.entries(state.creatures[actorId].moves)
        .filter(([, pp]) => pp > 0).map(([move]) => ({ id: 'move', actorId, move })),
      resolveCommand: (state, command) => ({ changes: [{ type: 'increment', path: ['creatures', command.actorId, 'moves', command.move], value: -1 }] }),
      getOutcome: () => null,
    };
    const battle = new Battle({}, { rules: ppRules });
    battle.start();
    battle.submitCommand({ id: 'move', actorId: 'leaf', move: 'vine' });
    expect(battle.state.game.creatures.leaf.moves.vine).toBe(1);
    expect(battle.state.game).not.toHaveProperty('hp');
  });

  it('allows timing rules to use the explicit clock dependency', () => {
    const clock = createManualClock(500);
    const timingRules = {
      ...contestRules,
      resolveCommand: (state, command, context) => ({ state: { ...state, timing: context.clock.now() - command.openedAt } }),
    };
    const battle = new Battle({}, { rules: timingRules, clock });
    battle.start();
    clock.advance(120);
    battle.submitCommand({ id: 'appeal', actorId: 'red', openedAt: 500 });
    expect(battle.state.game.timing).toBe(120);
  });
});
