import { boxesOverlap as overlapBoxes, pointInRect } from '@phaser-game-engines/core';

/** Backward-compatible positional adapter over the shared centre-box query. */
export function boxesOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return overlapBoxes({ x: ax, y: ay, w: aw, h: ah }, { x: bx, y: by, w: bw, h: bh });
}

export { pointInRect };
