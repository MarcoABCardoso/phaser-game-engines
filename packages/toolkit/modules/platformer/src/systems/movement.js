// movement.js — pure decision helpers for the platformer kernel's newer traversal moves
// (one-way platforms, dash double-tap, and which kind of jump a press resolves to). No
// Phaser here, so the branching logic stays unit-testable; PlatformerScene feeds these the
// live body/input values and acts on the result.

// One-way ("thin") platform test: you land on top when descending onto it, but pass through
// from below or while deliberately dropping through. `prevBottom` is the player's feet
// position on the PREVIOUS frame — checking that (not the current one) means a fast fall
// that was above the surface last frame still lands instead of tunnelling through.
export function shouldCollideOneWay({
  velocityY,
  prevBottom,
  platformTop,
  grace = 8,
  dropping = false,
}) {
  if (dropping) return false; // holding down+jump: fall straight through
  if (velocityY < 0) return false; // rising: pass up through the underside
  return prevBottom <= platformTop + grace; // feet were on/above the top last frame -> land
}

// Double-tap detector for a dash. `state` is the last tap seen: { dir, at } (or null). A tap
// of the SAME direction within `windowMs` fires a dash and clears the state (so a held-down
// third tap can't chain a second dash). Returns the next state and whether a dash fired.
export function registerTap(state, dir, time, windowMs) {
  if (state && state.dir === dir && time - state.at <= windowMs) {
    return { state: { dir: 0, at: time }, dashed: true };
  }
  return { state: { dir, at: time }, dashed: false };
}

// Resolve a jump press to the move it should perform, in priority order: a deliberate
// drop-through (down held while resting on a one-way platform) wins, then a ground jump
// (including the brief coyote window just after leaving a ledge), then a wall jump if
// clinging to a wall, then a mid-air jump if the air-jump budget allows (double jump),
// else nothing. Optional inputs default off so a caller can pass only what it uses.
export function resolveJump({
  onGround,
  coyoteOk = false,
  dropRequested,
  onOneWay,
  touchingWallDir = 0,
  wallJumpEnabled = false,
  airJumpsUsed,
  airJumpAllowance,
}) {
  if (dropRequested && onOneWay) return 'drop';
  if (onGround || coyoteOk) return 'ground';
  if (wallJumpEnabled && touchingWallDir !== 0) return 'wall';
  if (airJumpsUsed < airJumpAllowance) return 'air';
  return 'none';
}

// Find a ledge the player can grab: the near top corner of a solid on the side they're
// reaching toward (`dir`), within `reach` px horizontally of their leading edge and with
// its top surface near their hands (their head, within `band` px). Returns { top, faceX,
// dir } for the first match, or null. Pure over a plain list of solid rects {x,y,w,h}, so
// the collision geometry stays unit-testable.
export function findGrabbableLedge({
  playerTop,
  playerBottom,
  playerLeft,
  playerRight,
  dir,
  solids,
  reach = 12,
  band = 20,
}) {
  if (dir !== 1 && dir !== -1) return null;
  const frontX = dir > 0 ? playerRight : playerLeft;
  for (const s of solids) {
    const faceX = dir > 0 ? s.x : s.x + s.w; // the wall face we're reaching toward
    if (Math.abs(frontX - faceX) > reach) continue; // not close enough to the face
    const top = s.y;
    if (top < playerTop - band || top > playerTop + band) continue; // ledge not at hand height
    if (playerBottom <= top || playerTop >= s.y + s.h) continue; // must be beside the wall
    return { top, faceX, dir };
  }
  return null;
}
