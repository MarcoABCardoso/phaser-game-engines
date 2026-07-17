// geometry.js — pure axis-aligned box helpers shared by world entities. Kept
// Phaser-free so the collision math stays unit-testable, in the same spirit as the
// other engine systems modules.

// Do two centre-based boxes overlap? (ax, ay) is a box centre with size aw×ah;
// (bx, by) likewise. Touching exactly at an edge counts as NOT overlapping.
export function boxesOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return Math.abs(ax - bx) * 2 < aw + bw && Math.abs(ay - by) * 2 < ah + bh;
}

// Is point (px, py) inside a top-left rect {x, y, w, h}? `mx`/`my` grow the rect by
// a symmetric margin on each axis (mx left+right, my top+bottom) — how the world's
// trigger/pickup/reach zones give themselves a little slack. my defaults to mx.
// Edges are inclusive, so a point exactly on the (unmargined) boundary counts.
export function pointInRect(px, py, rect, mx = 0, my = mx) {
  return (
    px >= rect.x - mx &&
    px <= rect.x + rect.w + mx &&
    py >= rect.y - my &&
    py <= rect.y + rect.h + my
  );
}
