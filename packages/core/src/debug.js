const describeValue = (value) => {
  if (typeof value === 'function') return `[Function ${value.name || 'anonymous'}]`;
  try { return structuredClone(value); } catch { return String(value); }
};

/** Collect lifecycle/battle events in a bounded, inspectable log. */
export function createDebugEventLog({ limit = 200 } = {}) {
  const entries = [];
  return Object.freeze({
    emit(type, payload) {
      entries.push({ type, payload: describeValue(payload) });
      if (entries.length > limit) entries.splice(0, entries.length - limit);
    },
    clear: () => { entries.length = 0; },
    snapshot: () => entries.map((entry) => ({ ...entry })),
  });
}

export function inspectCapabilities(provider) {
  const source = provider?.capabilities ?? provider;
  const entries = typeof source?.entries === 'function'
    ? source.entries()
    : Object.entries(source ?? {});
  return entries.map(([name, value]) => ({ name, value: describeValue(value) }));
}

export function inspectContextualActions(actions = [], context = {}) {
  return actions.map((action, index) => ({
    index,
    id: action?.id ?? null,
    label: action?.label ?? null,
    priority: Number.isFinite(action?.priority) ? action.priority : 0,
    available: Boolean(action && typeof action.execute === 'function'
      && (typeof action.available !== 'function' || action.available(context) !== false)),
  }));
}

/** Produce JSON-friendly state for any controller with `state` or `debugState()`. */
export function inspectController(controller) {
  const value = typeof controller?.debugState === 'function' ? controller.debugState() : controller?.state;
  return describeValue(value ?? null);
}
