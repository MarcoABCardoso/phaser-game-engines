const EMPTY_ACTION = Object.freeze({ pressed: false, down: false, released: false });

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
