import { describe, expect, it, vi } from 'vitest';
import {
  advanceActionActivation,
  executeContextualAction,
  selectContextualAction,
} from '../src/actions.js';
import { createInputIntent } from '../src/input.js';

describe('contextual actions', () => {
  it('selects the highest-priority available executable action', () => {
    const actions = [
      { id: 'low', priority: 1, execute() {} },
      { id: 'blocked', priority: 100, available: () => false, execute() {} },
      { id: 'high', priority: 5, execute() {} },
    ];
    expect(selectContextualAction(actions)?.id).toBe('high');
  });

  it('uses offer order as a stable tie breaker', () => {
    const actions = [
      { id: 'first', priority: 2, execute() {} },
      { id: 'second', priority: 2, execute() {} },
    ];
    expect(selectContextualAction(actions)?.id).toBe('first');
  });

  it('does not mutate the offered action list', () => {
    const actions = [
      { id: 'low', priority: 1, execute() {} },
      { id: 'high', priority: 2, execute() {} },
    ];
    selectContextualAction(actions);
    expect(actions.map((action) => action.id)).toEqual(['low', 'high']);
  });

  it('rechecks availability when executing', () => {
    let enabled = true;
    const execute = vi.fn(() => 'done');
    const action = { available: () => enabled, execute };
    expect(selectContextualAction([action])).toBe(action);
    enabled = false;
    expect(executeContextualAction(action)).toEqual({ executed: false, value: undefined });
    expect(execute).not.toHaveBeenCalled();
  });

  it('returns the action result to the caller', () => {
    expect(executeContextualAction({ execute: () => 42 })).toEqual({ executed: true, value: 42 });
  });
});

describe('contextual action activation', () => {
  const intent = (interact) => createInputIntent({ actions: { interact } });

  it('uses a press trigger by default', () => {
    const action = { id: 'read', execute() {} };
    expect(advanceActionActivation(action, null, intent({ pressed: true }), 16).triggered).toBe(true);
    expect(advanceActionActivation(action, null, intent({ down: true }), 16).triggered).toBe(false);
  });

  it('accumulates hold time across equivalent action offers', () => {
    const firstOffer = {
      id: 'rest',
      activation: { mode: 'hold', durationMs: 100 },
      execute() {},
    };
    const first = advanceActionActivation(firstOffer, null, intent({ down: true }), 40);
    expect(first.progress).toBeCloseTo(0.4);
    expect(first.triggered).toBe(false);

    // Entities normally create a fresh action object each frame; the stable id
    // keeps activation progress attached to the logical action.
    const nextOffer = { ...firstOffer };
    const second = advanceActionActivation(nextOffer, first.state, intent({ down: true }), 60);
    expect(second.progress).toBe(1);
    expect(second.triggered).toBe(true);
  });

  it('fires a hold once until released', () => {
    const action = { id: 'rest', activation: { mode: 'hold', durationMs: 50 }, execute() {} };
    const fired = advanceActionActivation(action, null, intent({ down: true }), 50);
    expect(fired.triggered).toBe(true);
    const stillHeld = advanceActionActivation(action, fired.state, intent({ down: true }), 50);
    expect(stillHeld.triggered).toBe(false);
    const released = advanceActionActivation(action, stillHeld.state, intent({ down: false }), 16);
    const heldAgain = advanceActionActivation(action, released.state, intent({ down: true }), 50);
    expect(heldAgain.triggered).toBe(true);
  });

  it('resets hold progress when selection changes', () => {
    const hold = (id) => ({ id, activation: { mode: 'hold', durationMs: 100 }, execute() {} });
    const first = advanceActionActivation(hold('a'), null, intent({ down: true }), 80);
    const second = advanceActionActivation(hold('b'), first.state, intent({ down: true }), 30);
    expect(second.progress).toBeCloseTo(0.3);
    expect(second.triggered).toBe(false);
  });

  it('rejects unknown activation modes', () => {
    const action = { id: 'bad', activation: { mode: 'repeat' }, execute() {} };
    expect(() => advanceActionActivation(action, null, intent({ down: true }), 16)).toThrow('activation mode');
  });
});
