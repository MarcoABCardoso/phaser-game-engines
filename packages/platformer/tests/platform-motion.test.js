import { describe, it, expect } from 'vitest';
import { motionDir, motionOmega, motionOffset } from '@phaser-game-engines/platformer/systems/platform-motion.js';

describe('platform-motion: bounded sweep model for ride-on platforms', () => {
  it('sweeps horizontally for axis x (back-compat with the original movers)', () => {
    const spec = { axis: 'x', range: 100, speed: 50 };
    expect(motionDir(spec)).toEqual({ x: 1, y: 0 });
    expect(motionOmega(spec)).toBeCloseTo(0.5); // speed / range
    // sin θ drives x only; y stays put.
    expect(motionOffset(spec, Math.PI / 2)).toEqual({ x: 100, y: 0 });
    expect(motionOffset(spec, -Math.PI / 2).x).toBeCloseTo(-100);
    expect(motionOffset(spec, 1).y).toBe(0);
  });

  it('sweeps vertically for axis y', () => {
    const spec = { axis: 'y', range: 80, speed: 40 };
    expect(motionDir(spec)).toEqual({ x: 0, y: 1 });
    expect(motionOffset(spec, Math.PI / 2)).toEqual({ x: 0, y: 80 });
  });

  it('sweeps along a normalized diagonal when given a dir vector', () => {
    const spec = { dir: { x: 1, y: -1 }, range: 100, speed: 50 };
    const d = motionDir(spec);
    expect(Math.hypot(d.x, d.y)).toBeCloseTo(1); // unit length
    const peak = motionOffset(spec, Math.PI / 2);
    // Reaches `range` along the diagonal: |offset| === range, up-and-to-the-right.
    expect(Math.hypot(peak.x, peak.y)).toBeCloseTo(100);
    expect(peak.x).toBeGreaterThan(0);
    expect(peak.y).toBeLessThan(0);
  });

  it('orbits a circle at constant radius, ω scaled by radius', () => {
    const spec = { path: 'circle', radius: 60, speed: 30 };
    expect(motionOmega(spec)).toBeCloseTo(0.5); // speed / radius
    // Every phase sits exactly `radius` from home — a bounded loop.
    for (const theta of [0, 0.7, 1.9, 3.3, 5.0]) {
      const o = motionOffset(spec, theta);
      expect(Math.hypot(o.x, o.y)).toBeCloseTo(60);
    }
  });

  it('never exceeds its stated reach for any phase (linear stays bounded by range)', () => {
    const spec = { axis: 'x', range: 130, speed: 110 };
    for (let theta = 0; theta < 20; theta += 0.13) {
      expect(Math.abs(motionOffset(spec, theta).x)).toBeLessThanOrEqual(130 + 1e-9);
    }
  });
});
