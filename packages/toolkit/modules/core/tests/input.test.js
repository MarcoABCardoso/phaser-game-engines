import { describe, expect, it } from 'vitest';
import { actionState, createInputIntent } from '../src/input.js';

describe('input intents', () => {
  it('normalizes diagonal movement to a unit vector', () => {
    const intent = createInputIntent({ move: { x: 1, y: 1 } });
    expect(intent.move.x).toBeCloseTo(Math.SQRT1_2);
    expect(intent.move.y).toBeCloseTo(Math.SQRT1_2);
  });

  it('clamps axes and preserves partial analog input', () => {
    expect(createInputIntent({ move: { x: 0.25, y: 0 } }).move).toEqual({ x: 0.25, y: 0 });
    expect(createInputIntent({ move: { x: 4, y: 0 } }).move).toEqual({ x: 1, y: 0 });
  });

  it('normalizes named actions and supplies an inert missing action', () => {
    const intent = createInputIntent({ actions: { interact: { pressed: true, down: true } } });
    expect(actionState(intent, 'interact')).toEqual({ pressed: true, down: true, released: false });
    expect(actionState(intent, 'missing')).toEqual({ pressed: false, down: false, released: false });
  });

  it('accepts boolean shorthand for simple input providers', () => {
    const intent = createInputIntent({ actions: { confirm: true } });
    expect(intent.actions.confirm).toEqual({ pressed: true, down: true, released: false });
  });
});
