import { describe, expect, it } from 'vitest';
import {
  createGamepadInputAdapter,
  createKeyboardInputAdapter,
  createTouchInputAdapter,
} from '../src/input-adapters.js';

class FakeTarget {
  listeners = new Map();
  addEventListener(name, listener) { this.listeners.set(name, [...(this.listeners.get(name) ?? []), listener]); }
  removeEventListener(name, listener) { this.listeners.set(name, (this.listeners.get(name) ?? []).filter((item) => item !== listener)); }
  emit(name, detail = {}) { for (const listener of this.listeners.get(name) ?? []) listener(detail); }
}

describe('keyboard input adapter', () => {
  it('normalizes movement, tracks edges, publishes prompts, and cleans up', () => {
    const target = new FakeTarget();
    const adapter = createKeyboardInputAdapter({ target });
    target.emit('keydown', { code: 'KeyD' });
    target.emit('keydown', { code: 'Space' });
    const first = adapter.read();
    expect(first.move).toEqual({ x: 1, y: 0 });
    expect(first.actions.jump).toEqual({ down: true, pressed: true, released: false });
    expect(first.meta.prompts.jump).toBe('Space / ArrowUp');
    expect(adapter.read().actions.jump.pressed).toBe(false);
    target.emit('keyup', { code: 'Space' });
    expect(adapter.read().actions.jump.released).toBe(true);
    expect(adapter.destroy()).toBe(true);
    expect(adapter.destroy()).toBe(false);
  });

  it('supports game-owned remapping without mutating the provided map', () => {
    const target = new FakeTarget();
    const original = { move: {}, actions: { use: ['KeyE'] } };
    const adapter = createKeyboardInputAdapter({ target, bindings: original });
    adapter.setBindings({ move: {}, actions: { use: ['KeyF'] } });
    target.emit('keydown', { code: 'KeyF' });
    expect(adapter.read().actions.use.pressed).toBe(true);
    expect(original.actions.use).toEqual(['KeyE']);
  });
});

describe('gamepad input adapter', () => {
  it('combines analog movement, d-pad overrides, buttons, and prompt labels', () => {
    const pad = { axes: [0.5, -0.75], buttons: Array.from({ length: 16 }, () => ({ pressed: false, value: 0 })) };
    const adapter = createGamepadInputAdapter({ getGamepad: () => pad, labels: { 0: 'A' } });
    pad.buttons[0] = { pressed: true, value: 1 };
    const intent = adapter.read();
    expect(intent.move.x).toBeCloseTo(0.5);
    expect(intent.move.y).toBeCloseTo(-0.75);
    expect(intent.actions.jump.pressed).toBe(true);
    expect(adapter.getPrompt('jump')).toBe('A');
    pad.buttons[15] = { pressed: true, value: 1 };
    expect(adapter.read().move.x).toBeCloseTo(0.8);
  });
});

describe('touch input adapter', () => {
  it('accepts virtual movement and arbitrary game-defined actions', () => {
    const adapter = createTouchInputAdapter({ actions: ['scan'], labels: { scan: 'Observe' } });
    adapter.setMove(1, 1);
    adapter.setAction('scan', true);
    const intent = adapter.read();
    expect(Math.hypot(intent.move.x, intent.move.y)).toBeCloseTo(1);
    expect(intent.actions.scan.pressed).toBe(true);
    expect(intent.meta.prompts.scan).toBe('Observe');
    adapter.setAction('scan', false);
    expect(adapter.read().actions.scan.released).toBe(true);
  });
});
