import { describe, expect, it } from 'vitest';
import { facingFromVelocity, movementFromIntent, resolveMovement } from '../src/systems/movement.js';

describe('top-down movement', () => {
  it('normalizes diagonal speed', () => expect(resolveMovement({ right: true, down: true, speed: 100 })).toEqual({ x: 100 * Math.SQRT1_2, y: 100 * Math.SQRT1_2 }));
  it('uses zero velocity without input', () => expect(resolveMovement({ speed: 100 })).toEqual({ x: 0, y: 0 }));
  it('selects the dominant movement direction as facing', () => expect(facingFromVelocity(-3, 1)).toBe('left'));
  it('converts analog intent to velocity', () => expect(movementFromIntent({ x: 0.5, y: 0 }, 100)).toEqual({ x: 50, y: 0 }));
  it('guards against oversized intent vectors', () => {
    const velocity = movementFromIntent({ x: 2, y: 2 }, 100);
    expect(Math.hypot(velocity.x, velocity.y)).toBeCloseTo(100);
  });
});
