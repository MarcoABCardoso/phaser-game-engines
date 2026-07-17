import { describe, expect, it, vi } from 'vitest';
import { createLifecycle } from '../src/lifecycle.js';

describe('lifecycle events', () => {
  it('publishes payloads to listeners in registration order', () => {
    const lifecycle = createLifecycle();
    const calls = [];
    const payload = { time: 12, delta: 16 };
    lifecycle.on('tick', (value) => calls.push(['first', value]));
    lifecycle.on('tick', (value) => calls.push(['second', value]));

    expect(lifecycle.emit('tick', payload)).toBe(2);
    expect(calls).toEqual([['first', payload], ['second', payload]]);
  });

  it('returns an idempotent unsubscribe function', () => {
    const lifecycle = createLifecycle();
    const listener = vi.fn();
    const unsubscribe = lifecycle.on('tick', listener);

    expect(unsubscribe()).toBe(true);
    expect(unsubscribe()).toBe(false);
    expect(lifecycle.emit('tick')).toBe(0);
    expect(listener).not.toHaveBeenCalled();
  });

  it('runs a one-shot listener only once, including during recursive emission', () => {
    const lifecycle = createLifecycle();
    const listener = vi.fn(() => lifecycle.emit('ready'));
    lifecycle.once('ready', listener);

    lifecycle.emit('ready');
    lifecycle.emit('ready');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('defers listeners added during publication until the next publication', () => {
    const lifecycle = createLifecycle();
    const late = vi.fn();
    lifecycle.on('tick', () => lifecycle.on('tick', late));

    lifecycle.emit('tick');
    expect(late).not.toHaveBeenCalled();
    lifecycle.emit('tick');
    expect(late).toHaveBeenCalledTimes(1);
  });

  it('honors removal during publication and can clear all events', () => {
    const lifecycle = createLifecycle();
    const removed = vi.fn();
    let remove;
    lifecycle.on('tick', () => remove());
    remove = lifecycle.on('tick', removed);
    lifecycle.on('ready', removed);

    expect(lifecycle.emit('tick')).toBe(1);
    lifecycle.clear();
    expect(lifecycle.emit('ready')).toBe(0);
    expect(removed).not.toHaveBeenCalled();
  });

  it('rejects invalid names and listeners', () => {
    const lifecycle = createLifecycle();
    expect(() => lifecycle.on(null, () => {})).toThrow(TypeError);
    expect(() => lifecycle.on('tick', null)).toThrow(TypeError);
    expect(() => lifecycle.emit({})).toThrow(TypeError);
  });

  it('runs every listener even when one fails', () => {
    const lifecycle = createLifecycle();
    const later = vi.fn();
    lifecycle.on('shutdown', () => { throw new Error('broken cleanup'); });
    lifecycle.on('shutdown', later);

    expect(() => lifecycle.emit('shutdown')).toThrow(AggregateError);
    expect(later).toHaveBeenCalledOnce();
  });
});
