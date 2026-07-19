import { describe, it, expect } from 'vitest';
import { boxesOverlap, pointInRect } from '@phaser-game-engines/toolkit/platformer/systems/geometry.js';

describe('geometry: centre-based AABB overlap', () => {
  it('detects boxes whose interiors intersect', () => {
    expect(boxesOverlap(0, 0, 10, 10, 4, 0, 10, 10)).toBe(true);
    expect(boxesOverlap(0, 0, 10, 10, 0, 0, 2, 2)).toBe(true);
  });

  it('treats an exact edge-touch as no overlap (matches Arcade contact)', () => {
    expect(boxesOverlap(0, 0, 10, 10, 10, 0, 10, 10)).toBe(false);
    expect(boxesOverlap(0, 0, 10, 10, 0, 10, 10, 10)).toBe(false);
  });

  it('rejects clearly separated boxes', () => {
    expect(boxesOverlap(0, 0, 10, 10, 100, 100, 10, 10)).toBe(false);
  });

  it('separates on either axis independently', () => {
    // Overlaps on x but not y.
    expect(boxesOverlap(0, 0, 10, 10, 0, 40, 10, 10)).toBe(false);
    // Overlaps on y but not x.
    expect(boxesOverlap(0, 0, 10, 10, 40, 0, 10, 10)).toBe(false);
  });
});

describe('geometry: point-in-rect with margins', () => {
  const rect = { x: 10, y: 10, w: 20, h: 20 }; // spans 10..30 on both axes

  it('includes interior points and boundary edges', () => {
    expect(pointInRect(20, 20, rect)).toBe(true);
    expect(pointInRect(10, 10, rect)).toBe(true); // corner is inclusive
    expect(pointInRect(30, 30, rect)).toBe(true);
  });

  it('excludes points outside the unmargined rect', () => {
    expect(pointInRect(9, 20, rect)).toBe(false);
    expect(pointInRect(20, 31, rect)).toBe(false);
  });

  it('a symmetric margin grows the rect on both axes', () => {
    expect(pointInRect(5, 20, rect, 5)).toBe(true); // 10 - 5 = 5
    expect(pointInRect(4, 20, rect, 5)).toBe(false);
  });

  it('mx and my grow their axes independently (my defaults to mx)', () => {
    expect(pointInRect(20, 4, rect, 0, 6)).toBe(true); // y margin only
    expect(pointInRect(4, 20, rect, 0, 6)).toBe(false); // x got no margin
  });
});
