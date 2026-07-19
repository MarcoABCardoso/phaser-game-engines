const EMPTY_ACTION = Object.freeze({ pressed: false, down: false, released: false });

/** @typedef {{ pressed: boolean, down: boolean, released: boolean }} InputActionState */
/** @typedef {boolean | Partial<InputActionState>} InputActionSource */
/** @typedef {{ move?: { x?: number, y?: number }, actions?: Record<string, InputActionSource>, meta?: Record<string, unknown> }} InputIntentSource */
/** @typedef {{ move: { x: number, y: number }, actions: Record<string, InputActionState>, meta: Record<string, unknown> }} InputIntent */

function normalizeAxis(value) {
  const number = Number(value) || 0;
  return Math.max(-1, Math.min(1, number));
}

function normalizeAction(value = EMPTY_ACTION) {
  if (typeof value === 'boolean') {
    return { pressed: value, down: value, released: false };
  }
  return {
    pressed: Boolean(value.pressed),
    down: Boolean(value.down),
    released: Boolean(value.released),
  };
}

/**
 * Build the canonical input shape consumed by headless controllers and scenes.
 * Movement is clamped to a unit circle so digital and analog sources share the
 * same maximum magnitude. Action names are deliberately game-defined.
 */
/** @param {InputIntentSource} source @returns {InputIntent} */
export function createInputIntent({ move = {}, actions = {}, meta = {} } = {}) {
  let x = normalizeAxis(move.x);
  let y = normalizeAxis(move.y);
  const magnitude = Math.hypot(x, y);
  if (magnitude > 1) {
    x /= magnitude;
    y /= magnitude;
  }

  return {
    move: { x, y },
    actions: Object.fromEntries(
      Object.entries(actions).map(([name, value]) => [name, normalizeAction(value)]),
    ),
    meta: { ...meta },
  };
}

export function actionState(intent, name) {
  return intent?.actions?.[name] ?? EMPTY_ACTION;
}
