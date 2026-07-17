const clone = (value) => value === undefined ? undefined : structuredClone(value);

/** Record normalized intents and battle commands on one explicit timeline. */
export function createSessionRecorder({ clock = { now: () => 0 }, metadata = {} } = {}) {
  if (typeof clock?.now !== 'function') throw new TypeError('Recorder clock must expose now().');
  const entries = [];

  function record(type, payload) {
    if (typeof type !== 'string' || !type) throw new TypeError('Recording entry type must be a non-empty string.');
    const entry = { index: entries.length, time: clock.now(), type, payload: clone(payload) };
    entries.push(entry);
    return entry;
  }

  return Object.freeze({
    record,
    recordIntent: (intent) => record('inputIntent', intent),
    recordBattleCommand: (command) => record('battleCommand', command),
    clear: () => { entries.length = 0; },
    snapshot: () => ({ version: 1, metadata: clone(metadata), entries: clone(entries) }),
    get entries() { return entries.map(clone); },
  });
}

/** Replay a recording in stable `(time, index)` order without wall-clock waits. */
export function replaySession(recording, handlers = {}) {
  if (recording?.version !== 1 || !Array.isArray(recording.entries)) {
    throw new TypeError('Recording must be a version 1 session recording.');
  }
  const ordered = [...recording.entries].sort((a, b) => a.time - b.time || a.index - b.index);
  for (const entry of ordered) {
    const payload = clone(entry.payload);
    handlers.onEntry?.(entry.type, payload, entry);
    if (entry.type === 'inputIntent') handlers.onIntent?.(payload, entry);
    if (entry.type === 'battleCommand') handlers.onBattleCommand?.(payload, entry);
  }
  return ordered.length;
}
