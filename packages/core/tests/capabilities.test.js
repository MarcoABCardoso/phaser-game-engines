import { describe, expect, it, vi } from 'vitest';
import {
  createCapabilities,
  createMechanicHost,
  getCapability,
  hasCapability,
} from '@phaser-game-engines/core';

describe('capabilities', () => {
  it('supports game-defined values and guarded removal', () => {
    const capabilities = createCapabilities({ interactable: true });
    const receiver = vi.fn();
    const stop = capabilities.provide('damageReceiver', receiver);

    expect(hasCapability({ capabilities }, 'interactable')).toBe(true);
    expect(getCapability({ capabilities }, 'damageReceiver')).toBe(receiver);
    expect(stop()).toBe(true);
    expect(stop()).toBe(false);
  });
});

describe('mechanic host', () => {
  it('installs once and cleans resources in reverse order', () => {
    const events = [];
    const host = createMechanicHost({});
    const first = () => { events.push('first+'); return () => events.push('first-'); };
    const second = { install() { events.push('second+'); return () => events.push('second-'); } };

    const removeFirst = host.install(first);
    expect(host.install(first)).toBe(removeFirst);
    host.install(second);
    host.clear();

    expect(events).toEqual(['first+', 'second+', 'second-', 'first-']);
    expect(removeFirst()).toBe(false);
  });

  it('removes every mechanic even when one cleanup fails', () => {
    const later = vi.fn();
    const host = createMechanicHost({});
    const first = () => later;
    const broken = () => () => { throw new Error('cleanup failed'); };
    host.install(first);
    host.install(broken);

    expect(() => host.clear()).toThrow(AggregateError);
    expect(later).toHaveBeenCalledOnce();
    expect(host.has(first)).toBe(false);
    expect(host.has(broken)).toBe(false);
  });
});
