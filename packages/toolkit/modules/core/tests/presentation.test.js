import { describe, expect, it, vi } from 'vitest';
import { createPresentationHost } from '../src/presentation.js';

describe('presentation host', () => {
  it('creates prefabs with a distinct root and physics body', () => {
    const scene = {};
    const root = { destroy: vi.fn() };
    const body = {};
    const host = createPresentationHost(scene, {
      prefabs: { player: (context) => ({ root, body, context }) },
    });

    const handle = host.createPrefab('player', { x: 12 });

    expect(handle.root).toBe(root);
    expect(handle.body).toBe(body);
    expect(host.size).toBe(1);
    handle.destroy();
    expect(root.destroy).toHaveBeenCalledOnce();
    expect(host.size).toBe(0);
  });

  it('updates presenters and cleans them up in reverse order', () => {
    const events = [];
    const host = createPresentationHost({}, {
      presenters: {
        panel: ({ id }) => ({
          root: null,
          update: (model) => events.push(`update:${id}:${model}`),
          destroy: () => events.push(`destroy:${id}`),
        }),
      },
    });

    const first = host.present('panel', { id: 'first' });
    host.present('panel', { id: 'second' });
    first.update('ready');
    host.clear();

    expect(events).toEqual(['update:first:ready', 'destroy:second', 'destroy:first']);
    expect(first.update('late')).toBe(false);
  });

  it('supports a fallback and reports missing factories', () => {
    const root = { destroy: vi.fn() };
    const host = createPresentationHost({});
    expect(host.createPrefab('player', {}, () => root).root).toBe(root);
    expect(() => host.present('dialog')).toThrow('No presenter factory');
  });

  it('rejects invalid factory results', () => {
    const host = createPresentationHost({}, { presenters: { bad: () => 'panel' } });
    expect(() => host.present('bad')).toThrow('must return an object');
  });

  it('continues cleanup after a presenter throws', () => {
    const cleaned = vi.fn();
    const host = createPresentationHost({}, {
      presenters: {
        bad: () => ({ root: null, destroy: () => { throw new Error('bad cleanup'); } }),
        good: () => ({ root: null, destroy: cleaned }),
      },
    });
    host.present('good');
    host.present('bad');

    expect(() => host.clear()).toThrow(AggregateError);
    expect(cleaned).toHaveBeenCalledOnce();
    expect(host.size).toBe(0);
  });
});
