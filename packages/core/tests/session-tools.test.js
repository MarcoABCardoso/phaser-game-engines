import { describe, expect, it, vi } from 'vitest';
import {
  captureSessionSnapshot,
  createBugReportBundle,
  createManualClock,
  createMemoryStorage,
  createReplayViewer,
  createSaveStore,
  createSessionRecorder,
  createSimulationHarness,
  createSnapshotCodec,
  restoreSessionSnapshot,
} from '../src/index.js';

describe('session developer tools', () => {
  it('captures and restores only explicitly registered components', () => {
    const clock = createManualClock(12);
    const snapshot = captureSessionSnapshot({ clock, game: () => ({ score: 4 }) });
    clock.set(99);
    const restored = vi.fn();
    restoreSessionSnapshot(snapshot, { clock, game: restored });
    expect(clock.now()).toBe(12);
    expect(restored).toHaveBeenCalledWith({ score: 4 });
  });

  it('uses save slots and returns raw recovery data on migration failure', () => {
    const storage = createMemoryStorage();
    const codec = createSnapshotCodec({ version: 2, capture: (value) => value });
    const saves = createSaveStore({ storage, codec });
    saves.save('one', { score: 2 });
    expect(saves.slots()).toEqual(['one']);
    expect(saves.load('one')).toMatchObject({ ok: true, value: { score: 2 } });
    storage.write('pge:save:bad', '{broken');
    expect(saves.load('bad')).toMatchObject({ ok: false, reason: 'invalid-or-unmigratable' });
  });

  it('reports the first replay checkpoint divergence', () => {
    const clock = createManualClock();
    const recorder = createSessionRecorder({ clock });
    recorder.recordIntent({ move: { x: 1 } });
    recorder.recordCheckpoint({ x: 4 });
    const intents = [];
    const viewer = createReplayViewer(recorder.snapshot(), {
      onIntent: (intent) => intents.push(intent),
      captureState: () => ({ x: 5 }),
    });
    viewer.play();
    viewer.update(10);
    expect(intents).toEqual([{ move: { x: 1 } }]);
    expect(viewer.state.divergence).toMatchObject({ index: 1, expected: { x: 4 }, actual: { x: 5 } });
  });

  it('drives deterministic vertical-slice steps', () => {
    const clock = createManualClock();
    let x = 0;
    const harness = createSimulationHarness({
      clock,
      step: (input) => ({ x: (x += input) }),
      snapshot: () => ({ x }),
    });
    expect(harness.run([1, 2])).toEqual([{ x: 1 }, { x: 3 }]);
    expect(harness.snapshot()).toEqual({ x: 3 });
    expect(clock.now()).toBe(32);
  });

  it('excludes game data from bug reports unless explicitly supplied', () => {
    expect(createBugReportBundle({ seed: 4 })).not.toHaveProperty('gameData');
    expect(createBugReportBundle({ gameData: { safe: true } })).toHaveProperty('gameData.safe', true);
  });
});
