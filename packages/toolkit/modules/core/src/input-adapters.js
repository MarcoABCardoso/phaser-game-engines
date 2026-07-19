import { createInputIntent } from './input.js';

const KEYBOARD_BINDINGS = Object.freeze({
  move: {
    left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'],
    up: ['ArrowUp', 'KeyW'], down: ['ArrowDown', 'KeyS'],
  },
  actions: { interact: ['KeyE'], primary: ['Space'], jump: ['Space', 'ArrowUp'] },
});

const GAMEPAD_BINDINGS = Object.freeze({
  move: { xAxis: 0, yAxis: 1, left: [14], right: [15], up: [12], down: [13] },
  actions: { interact: [2], primary: [0], jump: [0] },
});

/**
 * Create a DOM-keyboard adapter for the canonical input intent shape.
 * The target is injected so tests, iframes, and games with focused canvases do
 * not need to rely on the global window.
 * @param {{ target?: EventTarget, bindings?: Record<string, any>, labels?: Record<string, string> }} options
 */
export function createKeyboardInputAdapter({
  target = globalThis,
  bindings = KEYBOARD_BINDINGS,
  labels = {},
} = {}) {
  if (typeof target?.addEventListener !== 'function' || typeof target?.removeEventListener !== 'function') {
    throw new TypeError('Keyboard input target must be an EventTarget.');
  }
  const down = new Set();
  const press = (event) => down.add(event.code);
  const release = (event) => down.delete(event.code);
  const blur = () => down.clear();
  target.addEventListener('keydown', press);
  target.addEventListener('keyup', release);
  target.addEventListener('blur', blur);

  const adapter = createDigitalAdapter({
    device: 'keyboard', bindings, labels,
    isDown: (control) => down.has(control),
  });
  let destroyed = false;
  return Object.freeze({
    ...adapter,
    destroy() {
      if (destroyed) return false;
      destroyed = true;
      down.clear();
      adapter.reset();
      target.removeEventListener('keydown', press);
      target.removeEventListener('keyup', release);
      target.removeEventListener('blur', blur);
      return true;
    },
  });
}

/** Create a polling adapter for the standard browser Gamepad API shape.
 * @param {{ index?: number, getGamepad?: () => Gamepad | null, bindings?: Record<string, any>, labels?: Record<string, string>, deadzone?: number }} options
 */
export function createGamepadInputAdapter({
  index = 0,
  getGamepad = () => globalThis.navigator?.getGamepads?.()[index] ?? null,
  bindings = GAMEPAD_BINDINGS,
  labels = {},
  deadzone = 0.2,
} = {}) {
  let currentBindings = cloneBindings(bindings);
  let previous = new Map();
  const threshold = Math.max(0, Math.min(1, Number(deadzone) || 0));

  function read() {
    const gamepad = getGamepad?.() ?? null;
    const movement = currentBindings.move ?? {};
    const rawX = axis(gamepad, movement.xAxis, threshold);
    const rawY = axis(gamepad, movement.yAxis, threshold);
    const x = digital(gamepad, movement.right) - digital(gamepad, movement.left) || rawX;
    const y = digital(gamepad, movement.down) - digital(gamepad, movement.up) || rawY;
    const actions = edgeActions(currentBindings.actions, (button) => buttonDown(gamepad, button), previous);
    previous = new Map(Object.entries(actions).map(([name, state]) => [name, state.down]));
    return createInputIntent({ move: { x, y }, actions, meta: metadata('gamepad', currentBindings, labels) });
  }

  return Object.freeze({
    read,
    setBindings(next) { currentBindings = cloneBindings(next); previous.clear(); return cloneBindings(currentBindings); },
    getBindings: () => cloneBindings(currentBindings),
    getPrompt: (action) => promptFor(currentBindings.actions?.[action], labels, 'Button'),
    reset() { previous.clear(); },
  });
}

/**
 * Create an imperative adapter for virtual sticks, on-screen buttons, or other
 * touch UI. Games connect their own presentation to setMove/setAction.
 * @param {{ actions?: string[], labels?: Record<string, string> }} options
 */
export function createTouchInputAdapter({ actions = [], labels = {} } = {}) {
  let move = { x: 0, y: 0 };
  const down = new Map(actions.map((name) => [name, false]));
  let previous = new Map();

  function read() {
    const states = edgeActions(
      { ...Object.fromEntries(down.keys().map((name) => [name, [name]])) },
      (name) => down.get(name) === true,
      previous,
    );
    previous = new Map(Object.entries(states).map(([name, state]) => [name, state.down]));
    const prompts = Object.fromEntries(down.keys().map((name) => [name, labels[name] ?? name]));
    return createInputIntent({ move, actions: states, meta: { device: 'touch', prompts } });
  }

  return Object.freeze({
    read,
    setMove(x, y) { move = { x: Number(x) || 0, y: Number(y) || 0 }; },
    setAction(name, value) { if (!down.has(name)) down.set(name, false); down.set(name, Boolean(value)); },
    getPrompt: (action) => labels[action] ?? action,
    reset() { move = { x: 0, y: 0 }; down.clear(); for (const name of actions) down.set(name, false); previous.clear(); },
  });
}

function createDigitalAdapter({ device, bindings, labels, isDown }) {
  let currentBindings = cloneBindings(bindings);
  let previous = new Map();
  function read() {
    const movement = currentBindings.move ?? {};
    const x = active(movement.right, isDown) - active(movement.left, isDown);
    const y = active(movement.down, isDown) - active(movement.up, isDown);
    const actions = edgeActions(currentBindings.actions, isDown, previous);
    previous = new Map(Object.entries(actions).map(([name, state]) => [name, state.down]));
    return createInputIntent({ move: { x, y }, actions, meta: metadata(device, currentBindings, labels) });
  }
  return Object.freeze({
    read,
    setBindings(next) { currentBindings = cloneBindings(next); previous.clear(); return cloneBindings(currentBindings); },
    getBindings: () => cloneBindings(currentBindings),
    getPrompt: (action) => promptFor(currentBindings.actions?.[action], labels, ''),
    reset() { previous.clear(); },
  });
}

function edgeActions(bindings = {}, isDown, previous) {
  return Object.fromEntries(Object.entries(bindings ?? {}).map(([name, controls]) => {
    const down = active(controls, isDown);
    const wasDown = previous.get(name) === true;
    return [name, { down, pressed: down && !wasDown, released: !down && wasDown }];
  }));
}

function active(controls = [], isDown) {
  return array(controls).some((control) => isDown(control));
}

function digital(gamepad, controls = []) {
  return active(controls, (button) => buttonDown(gamepad, button)) ? 1 : 0;
}

function buttonDown(gamepad, index) {
  const button = gamepad?.buttons?.[index];
  return Boolean(button && (button.pressed || button.value > 0.5));
}

function axis(gamepad, index, deadzone) {
  const value = Number(gamepad?.axes?.[index]) || 0;
  return Math.abs(value) < deadzone ? 0 : Math.max(-1, Math.min(1, value));
}

function metadata(device, bindings, labels) {
  return {
    device,
    prompts: Object.fromEntries(Object.keys(bindings.actions ?? {}).map((name) => [
      name, promptFor(bindings.actions[name], labels, device === 'gamepad' ? 'Button' : ''),
    ])),
  };
}

function promptFor(controls, labels, prefix) {
  return array(controls).map((control) => labels[control] ?? `${prefix}${prefix ? ' ' : ''}${control}`).join(' / ');
}

function array(value) { return Array.isArray(value) ? value : value === undefined ? [] : [value]; }
function cloneBindings(value) { return structuredClone(value ?? {}); }
