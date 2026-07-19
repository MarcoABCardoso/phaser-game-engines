/**
 * Create a small, serializable PRNG. The returned function is compatible with
 * APIs that expect `Math.random`, and also exposes `next/getState/setState`.
 */
export function createSeededRng(seed = 0x6d2b79f5) {
  let state = Number(seed) >>> 0;
  const initialSeed = state;

  function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }

  next.next = next;
  next.getState = () => ({ algorithm: 'mulberry32', seed: initialSeed, state });
  next.setState = (snapshot) => {
    if (snapshot?.algorithm !== 'mulberry32' || !Number.isInteger(snapshot.state)) {
      throw new TypeError('RNG state must be a mulberry32 snapshot.');
    }
    state = snapshot.state >>> 0;
  };
  return next;
}

/** A deterministic clock whose time advances only when the caller asks it to. */
export function createManualClock(initialTime = 0) {
  let time = Number(initialTime);
  if (!Number.isFinite(time)) throw new TypeError('Clock time must be finite.');
  return Object.freeze({
    now: () => time,
    advance(delta = 0) {
      const amount = Number(delta);
      if (!Number.isFinite(amount) || amount < 0) throw new TypeError('Clock delta must be a non-negative finite number.');
      time += amount;
      return time;
    },
    set(value) {
      const next = Number(value);
      if (!Number.isFinite(next)) throw new TypeError('Clock time must be finite.');
      time = next;
      return time;
    },
    getState: () => ({ time }),
    setState(snapshot) {
      if (!snapshot || !Number.isFinite(snapshot.time)) throw new TypeError('Clock state must contain a finite time.');
      time = snapshot.time;
    },
  });
}

export function systemClock() {
  return Object.freeze({ now: () => Date.now() });
}
