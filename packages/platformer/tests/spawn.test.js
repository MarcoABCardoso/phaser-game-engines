import { describe, it, expect } from 'vitest';
import { randomPointInRect, resolveSpawnPoint } from '@phaser-game-engines/platformer/systems/spawn.js';

// A deterministic RNG that yields a scripted sequence of [0,1) values, so placement
// tests are exact rather than statistical.
function seqRng(values) {
  let i = 0;
  return () => values[i++ % values.length];
}

describe('spawn: randomPointInRect', () => {
  const rect = { x: 100, y: 200, w: 40, h: 20 };

  it('maps rng output linearly across the rect', () => {
    expect(randomPointInRect(rect, seqRng([0, 0]))).toEqual({ x: 100, y: 200 });
    expect(randomPointInRect(rect, seqRng([0.5, 0.5]))).toEqual({ x: 120, y: 210 });
  });

  it('stays within the rect for any rng in [0,1)', () => {
    const p = randomPointInRect(rect, seqRng([0.999, 0.001]));
    expect(p.x).toBeGreaterThanOrEqual(rect.x);
    expect(p.x).toBeLessThan(rect.x + rect.w);
    expect(p.y).toBeGreaterThanOrEqual(rect.y);
    expect(p.y).toBeLessThan(rect.y + rect.h);
  });
});

describe('spawn: resolveSpawnPoint strategies', () => {
  it('fixed placement returns the given point', () => {
    expect(resolveSpawnPoint({ x: 5, y: 7 })).toEqual({ x: 5, y: 7 });
  });

  it('randomIn draws inside the region', () => {
    const p = resolveSpawnPoint({ randomIn: { x: 0, y: 0, w: 10, h: 10 } }, seqRng([0.5, 0.5]));
    expect(p).toEqual({ x: 5, y: 5 });
  });

  it('a scripted list cycles by index', () => {
    const place = { points: [{ x: 1, y: 1 }, { x: 2, y: 2 }, { x: 3, y: 3 }] };
    expect(resolveSpawnPoint(place, Math.random, 0)).toEqual({ x: 1, y: 1 });
    expect(resolveSpawnPoint(place, Math.random, 1)).toEqual({ x: 2, y: 2 });
    expect(resolveSpawnPoint(place, Math.random, 3)).toEqual({ x: 1, y: 1 }); // wraps
  });

  it('a scripted list can pick at random', () => {
    const place = { points: [{ x: 1, y: 1 }, { x: 2, y: 2 }], pick: 'random' };
    expect(resolveSpawnPoint(place, seqRng([0.9]))).toEqual({ x: 2, y: 2 });
    expect(resolveSpawnPoint(place, seqRng([0.1]))).toEqual({ x: 1, y: 1 });
  });

  it('falls back to origin when no strategy is given', () => {
    expect(resolveSpawnPoint(undefined)).toEqual({ x: 0, y: 0 });
  });
});
