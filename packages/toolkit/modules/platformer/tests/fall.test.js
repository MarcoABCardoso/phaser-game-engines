import { describe, it, expect } from 'vitest';
import {
  fallDamageForDrop,
  FALL_DAMAGE_MIN_DROP,
  FALL_DAMAGE_STEP,
  FALL_DAMAGE_MAX,
} from '@phaser-game-engines/toolkit/platformer/systems/fall.js';

describe('fall damage is a function of drop height', () => {
  it('costs no HP below the threshold (stumbles/clean landings are free)', () => {
    expect(fallDamageForDrop(0)).toBe(0);
    expect(fallDamageForDrop(FALL_DAMAGE_MIN_DROP - 1)).toBe(0);
  });

  it('a zero or negative drop never hurts — your own jump height is excluded', () => {
    // Springing straight up and landing where you started is a 0px drop; landing
    // higher than takeoff is negative. Neither should ever cost HP.
    expect(fallDamageForDrop(0)).toBe(0);
    expect(fallDamageForDrop(-300)).toBe(0);
  });

  it('costs 1 HP at the threshold and scales up with distance fallen', () => {
    expect(fallDamageForDrop(FALL_DAMAGE_MIN_DROP)).toBe(1);
    expect(fallDamageForDrop(FALL_DAMAGE_MIN_DROP + FALL_DAMAGE_STEP)).toBe(2);
    expect(fallDamageForDrop(FALL_DAMAGE_MIN_DROP + 2 * FALL_DAMAGE_STEP)).toBe(3);
  });

  it('is monotonic in drop height', () => {
    for (let d = 0; d < 1000; d += 37) {
      expect(fallDamageForDrop(d + 1)).toBeGreaterThanOrEqual(fallDamageForDrop(d));
    }
  });

  it('caps so a single fall can never exceed the max', () => {
    expect(fallDamageForDrop(10000)).toBe(FALL_DAMAGE_MAX);
  });
});
