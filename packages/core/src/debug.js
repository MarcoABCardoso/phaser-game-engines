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

/** Optional development-only text overlay; no Phaser import is required. */
export function createDebugOverlayMechanic(options = {}) {
  return function installDebugOverlay(scene) {
    if (!scene.add?.text) throw new Error('Debug overlay requires a scene text factory.');
    const text = scene.add.text(options.x ?? 8, options.y ?? 8, '', {
      fontFamily: 'monospace', fontSize: `${options.textSize ?? 12}px`, color: '#b8f7c4',
      backgroundColor: '#07110ddd', padding: { x: 6, y: 5 },
    });
    text.setScrollFactor?.(0);
    text.setDepth?.(options.depth ?? 1000);
    const update = ({ time = 0 } = {}) => {
      const lines = [
        `time ${Math.round(time)}`,
        `mechanics ${(scene.mechanicHost?.list?.() ?? []).join(', ') || 'none'}`,
        `actions ${(scene.contextualActions ?? []).map((action) => action.id ?? '?').join(', ') || 'none'}`,
      ];
      if (scene.traversalController) lines.push(`traversal ${JSON.stringify(inspectController(scene.traversalController))}`);
      if (scene.battle) lines.push(`battle ${JSON.stringify(inspectController(scene.battle))}`);
      const clockState = scene.worldRuntime?.clock?.getState?.();
      const rngState = scene.worldRuntime?.rng?.getState?.();
      if (clockState) lines.push(`clock ${JSON.stringify(clockState)}`);
      if (rngState) lines.push(`rng ${JSON.stringify(rngState)}`);
      if (options.getLines) lines.push(...options.getLines(scene));
      text.setText(lines.join('\n'));
    };
    const stop = scene.lifecycle.on('tick', update);
    update();
    return () => { stop(); text.destroy(); };
  };
}
