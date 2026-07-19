/** Stable lifecycle names published by the real-time scene adapters. */
export const lifecycleEvent = Object.freeze({
  ready: 'ready',
  tick: 'tick',
  shutdown: 'shutdown',
});

function assertEventName(event) {
  if (typeof event !== 'string' && typeof event !== 'symbol') {
    throw new TypeError('A lifecycle event name must be a string or symbol.');
  }
}

function assertListener(listener) {
  if (typeof listener !== 'function') {
    throw new TypeError('A lifecycle listener must be a function.');
  }
}

/**
 * Create a small synchronous event channel for headless controllers and Phaser adapters.
 *
 * Listeners run in registration order. Adding a listener while an event is being
 * published affects the next publication; removing one takes effect immediately.
 */
export function createLifecycle() {
  const listeners = new Map();

  function subscribe(event, listener, once) {
    assertEventName(event);
    assertListener(listener);
    const entry = { listener, once, active: true };
    const entries = listeners.get(event) ?? [];
    entries.push(entry);
    listeners.set(event, entries);

    return () => {
      if (!entry.active) return false;
      entry.active = false;
      const index = entries.indexOf(entry);
      if (index !== -1) entries.splice(index, 1);
      if (entries.length === 0) listeners.delete(event);
      return true;
    };
  }

  function on(event, listener) {
    return subscribe(event, listener, false);
  }

  function once(event, listener) {
    return subscribe(event, listener, true);
  }

  function emit(event, payload) {
    assertEventName(event);
    const entries = listeners.get(event);
    if (!entries) return 0;

    let invoked = 0;
    const errors = [];
    for (const entry of entries.slice()) {
      if (!entry.active) continue;
      if (entry.once) {
        entry.active = false;
        const index = entries.indexOf(entry);
        if (index !== -1) entries.splice(index, 1);
      }
      invoked += 1;
      try { entry.listener(payload); } catch (error) { errors.push(error); }
    }
    if (entries.length === 0) listeners.delete(event);
    if (errors.length) throw new AggregateError(errors, `Lifecycle event ${String(event)} failed.`);
    return invoked;
  }

  function clear(event) {
    if (event === undefined) {
      for (const entries of listeners.values()) {
        for (const entry of entries) entry.active = false;
      }
      listeners.clear();
      return;
    }

    assertEventName(event);
    const entries = listeners.get(event);
    if (!entries) return;
    for (const entry of entries) entry.active = false;
    listeners.delete(event);
  }

  return Object.freeze({ on, once, emit, clear });
}
