import { describe, expect, it } from 'vitest';
import {
  createCapabilities,
  createDebugEventLog,
  createInputIntent,
  createManualClock,
  createSeededRng,
  createSessionRecorder,
  inspectCapabilities,
  inspectContextualActions,
  inspectController,
  replaySession,
} from '@phaser-game-engines/core';

describe('deterministic dependencies and recordings', () => {
  it('reproduces and restores a seeded random stream', () => {
    const first = createSeededRng(42);
    const second = createSeededRng(42);
    expect([first(), first(), first()]).toEqual([second(), second(), second()]);
    const saved = first.getState();
    const expected = first();
    first();
    first.setState(saved);
    expect(first()).toBe(expected);
  });

  it('records and replays intents and commands in deterministic timeline order', () => {
    const clock = createManualClock(10);
    const recorder = createSessionRecorder({ clock, metadata: { seed: 7 } });
    recorder.recordIntent(createInputIntent({ actions: { interact: true } }));
    clock.advance(5);
    recorder.recordBattleCommand({ id: 'offer', actorId: 'speaker' });
    const seen = [];
    replaySession(recorder.snapshot(), {
      onIntent: (intent, entry) => seen.push([entry.time, intent.actions.interact.down]),
      onBattleCommand: (command, entry) => seen.push([entry.time, command.id]),
    });
    expect(seen).toEqual([[10, true], [15, 'offer']]);
  });
});

describe('debug inspection', () => {
  it('provides JSON-friendly event, capability, action, and controller views', () => {
    const log = createDebugEventLog({ limit: 1 });
    log.emit('old', { value: 1 });
    log.emit('tick', { value: 2 });
    expect(log.snapshot()).toEqual([{ type: 'tick', payload: { value: 2 } }]);

    const capabilities = createCapabilities({ talk: { range: 4 } });
    expect(inspectCapabilities(capabilities)).toEqual([{ name: 'talk', value: { range: 4 } }]);
    expect(inspectContextualActions([
      { id: 'read', priority: 2, execute() {} },
      { id: 'locked', available: () => false, execute() {} },
    ])).toMatchObject([{ id: 'read', available: true }, { id: 'locked', available: false }]);
    expect(inspectController({ state: { phase: 'ready' } })).toEqual({ phase: 'ready' });
  });
});
