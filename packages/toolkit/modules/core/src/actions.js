import { actionState } from './input.js';

function isAvailable(action, context) {
  return typeof action.available !== 'function' || action.available(context) !== false;
}

/** Select the highest-priority available action without mutating the offered list. */
export function selectContextualAction(actions = [], context = {}) {
  let selected = null;
  let selectedPriority = -Infinity;

  for (const action of actions) {
    if (!action || typeof action.execute !== 'function' || !isAvailable(action, context)) continue;
    const priority = Number.isFinite(action.priority) ? action.priority : 0;
    // Strictly greater preserves offer order when priorities tie.
    if (selected === null || priority > selectedPriority) {
      selected = action;
      selectedPriority = priority;
    }
  }

  return selected;
}

/** Execute an action only if it is still available in the current context. */
export function executeContextualAction(action, context = {}) {
  if (!action || typeof action.execute !== 'function' || !isAvailable(action, context)) {
    return { executed: false, value: undefined };
  }
  return { executed: true, value: action.execute(context) };
}

/**
 * Advance press/hold activation for the selected action.
 *
 * Actions default to `{ action: 'interact', mode: 'press' }`. A hold action may
 * declare `{ mode: 'hold', durationMs: 600 }`. The returned state is passed back
 * on the next frame; `triggered` fires only once until the input is released.
 */
export function advanceActionActivation(action, state, intent, delta = 0) {
  if (!action) {
    return { state: null, triggered: false, progress: 0 };
  }

  const activation = action.activation ?? {};
  const inputName = activation.action ?? 'interact';
  const mode = activation.mode ?? 'press';
  const input = actionState(intent, inputName);
  const key = action.id ?? action;
  const sameAction = state?.key === key;

  if (mode === 'press') {
    return {
      state: { key, heldMs: 0, fired: false },
      triggered: input.pressed,
      progress: input.pressed ? 1 : 0,
    };
  }

  if (mode !== 'hold') throw new Error(`Unknown contextual action activation mode: ${mode}`);
  const durationMs = Math.max(0, Number(activation.durationMs) || 0);
  if (!input.down) {
    return { state: { key, heldMs: 0, fired: false }, triggered: false, progress: 0 };
  }

  const heldMs = (sameAction ? state.heldMs : 0) + Math.max(0, delta);
  const wasFired = sameAction && state.fired;
  const triggered = !wasFired && heldMs >= durationMs;
  const fired = wasFired || triggered;
  return {
    state: { key, heldMs, fired },
    triggered,
    progress: durationMs === 0 ? 1 : Math.min(1, heldMs / durationMs),
  };
}
