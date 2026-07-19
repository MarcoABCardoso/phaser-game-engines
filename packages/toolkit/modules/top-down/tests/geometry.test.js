import { describe, expect, it } from 'vitest';
import { boxesOverlap, pointInRect } from '../src/systems/geometry.js';

describe('top-down geometry', () => {
  it('includes trigger edges', () => expect(pointInRect(10, 5, { x: 0, y: 0, w: 10, h: 5 })).toBe(true));
  it('does not count touching hitboxes as overlap', () => expect(boxesOverlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 10, y: 0, w: 10, h: 10 })).toBe(false));
});
