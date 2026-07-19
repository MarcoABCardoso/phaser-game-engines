const clone = (value) => structuredClone(value);
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);

/** Pauseable, step-driven replay with first-divergence reporting. */
export function createReplayViewer(recording, handlers = {}) {
  if (recording?.version !== 1 || !Array.isArray(recording.entries)) {
    throw new TypeError('Expected a version 1 session recording.');
  }
  const entries = [...recording.entries].sort((a, b) => a.time - b.time || a.index - b.index);
  let cursor = 0;
  let paused = true;
  let speed = 1;
  let divergence = null;

  function step(count = 1) {
    let processed = 0;
    while (cursor < entries.length && processed < count && !divergence) {
      const entry = entries[cursor];
      handlers.onEntry?.(entry.type, clone(entry.payload), entry);
      if (entry.type === 'inputIntent') handlers.onIntent?.(clone(entry.payload), entry);
      if (entry.type === 'battleCommand') handlers.onBattleCommand?.(clone(entry.payload), entry);
      if (entry.type === 'checkpoint' && handlers.captureState) {
        const actual = handlers.captureState(entry);
        const equal = handlers.compare?.(entry.payload, actual, entry) ?? same(entry.payload, actual);
        if (!equal) divergence = { index: entry.index, time: entry.time, expected: clone(entry.payload), actual: clone(actual) };
      }
      cursor += 1;
      processed += 1;
    }
    return processed;
  }

  return Object.freeze({
    play: () => { paused = false; },
    pause: () => { paused = true; },
    step,
    update: (entryBudget = 1) => paused ? 0 : step(Math.max(1, Math.floor(entryBudget * speed))),
    setSpeed(value) {
      if (!Number.isFinite(value) || value <= 0) throw new TypeError('Replay speed must be positive.');
      speed = value;
    },
    get state() { return { cursor, paused, speed, complete: cursor >= entries.length, divergence: clone(divergence) }; },
  });
}
