// platform-motion.js — pure position model for a ride-on kinematic platform. Given a
// motion descriptor and the current phase angle `theta`, it returns the platform CENTRE's
// offset from its home. Kept Phaser-free so the sweep math stays unit-testable; the
// MovingPlatform entity pins the body to `home + offset` each frame (see MovingPlatform).
//
// Both families are BOUNDED functions of theta, so a carrier can never drift off its pit no
// matter how long the run or how uneven the frame deltas:
//   - LINEAR ping-pong along a direction vector: offset = dir · (range · sin θ). Sweeps
//     between two extremes — horizontal ('x'), vertical ('y'), or any diagonal (`dir`).
//   - CIRCULAR: offset = radius · (cos θ, sin θ) — a steady loop around home.

// Unit-length direction vector; a zero vector falls back to +x (a horizontal sweep).
function unit(dir) {
  const x = dir?.x ?? 0;
  const y = dir?.y ?? 0;
  const len = Math.hypot(x, y);
  if (len === 0) return { x: 1, y: 0 };
  return { x: x / len, y: y / len };
}

// The direction a LINEAR platform sweeps along. `axis` is the terse form ('x' | 'y'); `dir`
// is the general one (an arbitrary diagonal). `dir` wins when both are present.
export function motionDir(spec) {
  if (spec.dir) return unit(spec.dir);
  return spec.axis === 'y' ? { x: 0, y: 1 } : { x: 1, y: 0 };
}

// Angular speed chosen so the platform's PEAK linear speed equals `spec.speed`:
//   - linear:   peak speed = range · ω   ->  ω = speed / range
//   - circular: constant speed = radius · ω  ->  ω = speed / radius
export function motionOmega(spec) {
  return spec.path === 'circle' ? spec.speed / spec.radius : spec.speed / spec.range;
}

// The platform centre's offset from home at phase `theta`.
export function motionOffset(spec, theta) {
  if (spec.path === 'circle') {
    return { x: spec.radius * Math.cos(theta), y: spec.radius * Math.sin(theta) };
  }
  const d = motionDir(spec);
  const s = spec.range * Math.sin(theta);
  return { x: d.x * s, y: d.y * s };
}
