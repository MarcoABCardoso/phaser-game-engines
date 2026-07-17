// spawn.js — pure spawn-placement logic. No Phaser: given a placement strategy and
// an injectable RNG it computes WHERE a thing appears. The Spawner entity holds the
// Phaser side and the stateful WHEN (its trigger); this stays a set of tested pure
// functions so "random or scripted spawn points" is verifiable without a browser.

// A uniform random point inside a top-left rect {x, y, w, h}. rng() returns [0, 1).
export function randomPointInRect(rect, rng = Math.random) {
  return {
    x: rect.x + rng() * rect.w,
    y: rect.y + rng() * rect.h,
  };
}

// Resolve a spawn point from a placement strategy. `index` distinguishes successive
// spawns in one burst, so a scripted list can cycle and a random region can vary:
//   { x, y }                 -> that exact point (fixed / hand-placed)
//   { randomIn: rect }       -> a uniform-random point inside the rect
//   { points: [...], pick }  -> from a scripted list: 'cycle' (default, by index)
//                               steps through in order; 'random' picks one at random
export function resolveSpawnPoint(place, rng = Math.random, index = 0) {
  if (!place) return { x: 0, y: 0 };
  if (place.randomIn) return randomPointInRect(place.randomIn, rng);
  if (place.points && place.points.length > 0) {
    const pts = place.points;
    if (place.pick === 'random') return pts[Math.floor(rng() * pts.length)];
    return pts[index % pts.length];
  }
  return { x: place.x ?? 0, y: place.y ?? 0 };
}
