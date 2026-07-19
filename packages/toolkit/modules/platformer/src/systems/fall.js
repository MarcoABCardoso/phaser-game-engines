// fall.js — the generic platformer fall-damage model. Pure, Phaser-free, so the
// stumble-vs-hurt curve stays unit-testable. Damage is a function of how far the
// player landed BELOW the surface they took off from — the player's own jump height
// never counts (springing up and landing where you started is a 0px drop). Small
// drops are free stumbles; past the threshold, damage scales with distance fallen.
// These are engine tuning; a level doesn't retune them.

export const FALL_DAMAGE_MIN_DROP = 165; // px dropped below takeoff before a landing costs HP
export const FALL_DAMAGE_STEP = 150; // each additional STEP px past the threshold costs +1 HP
export const FALL_DAMAGE_MAX = 3; // cap on HP lost from a single fall

export function fallDamageForDrop(drop) {
  if (drop < FALL_DAMAGE_MIN_DROP) return 0;
  return Math.min(FALL_DAMAGE_MAX, 1 + Math.floor((drop - FALL_DAMAGE_MIN_DROP) / FALL_DAMAGE_STEP));
}
