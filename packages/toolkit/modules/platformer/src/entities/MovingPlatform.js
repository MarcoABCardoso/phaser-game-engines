// MovingPlatform.js — a ride-on kinematic platform. It's a dynamic, immovable, gravity-
// free body whose position is pinned each frame to an analytic sweep about its home, so it
// moves smoothly along a bounded path and the player can stand on it to cross a pit. The
// path is a data choice (see platform-motion.js): a LINEAR ping-pong along any direction —
// horizontal ('x'), vertical ('y'), or a diagonal (`dir`) — or a CIRCULAR loop (`path:
// 'circle'` + `radius`). Pinning position directly (rather than integrating a velocity) is
// what keeps it exactly on its path for the whole run — see update(). The player/platform
// collider keeps a rider resting on top vertically; carry is manual — each frame we add the
// platform's own frame-delta (x AND y) to that rider, so any path carries them. The scene
// owns one `movers` group + player collider; a platform just joins it in spawn(), so adding
// another is one ENTITY_SPECS entry.
import Entity from './Entity.js';
import { motionOmega, motionOffset } from '../systems/platform-motion.js';

const COLOR = 0x5a7fa8;

export default class MovingPlatform extends Entity {
  static validateSpec(spec, { path, validateRect }) {
    validateRect(spec.rect, { path: `${path}.rect` });
  }

  spawn(scene) {
    const r = this.spec.rect; // home position/size {x,y,w,h} (top-left)
    this.homeX = r.x + r.w / 2;
    this.homeY = r.y + r.h / 2;
    // theta advances at w so peak speed = speed; phase staggers paired platforms.
    this.w = motionOmega(this.spec);
    this.theta = (this.spec.phase || 0) * Math.PI * 2;

    // Start on-path for the current phase (a circle is never AT its home — it orbits it).
    const o0 = motionOffset(this.spec, this.theta);
    this.rect = scene.add
      .rectangle(this.homeX + o0.x, this.homeY + o0.y, r.w, r.h, COLOR)
      .setDepth(20);
    scene.physics.add.existing(this.rect);
    scene.movers.add(this.rect);
    const b = this.rect.body;
    b.setAllowGravity(false);
    b.setImmovable(true);
    b.moves = true; // driven by velocity, not gravity/collision
  }

  update(scene, _time, delta) {
    if (!this.rect) return;
    const dt = delta / 1000;
    if (dt <= 0) return;
    this.theta += this.w * dt;
    const b = this.rect.body;
    // Pin the body straight to the EXACT analytic point on its path each frame (home +
    // offset(θ)). Position is then a pure, bounded function of θ — it can never drift off
    // the pit, no matter how long the run or how uneven the frame deltas. The earlier
    // approach integrated velocity, which accumulates error (and blows up on delta spikes):
    // after a there-and-back trip the carrier ended up off its gap and the jumps home were
    // impossible. θ only advances the phase; sin/cos keep the reach bounded.
    const offset = motionOffset(this.spec, this.theta);
    const targetX = this.homeX + offset.x;
    const targetY = this.homeY + offset.y;
    // The player rides on top; detect that against the platform's pre-move edges, then
    // carry them by the SAME displacement so they stay locked instead of sliding off.
    // (Geometric detection — Arcade's touching flags are unreliable for an immovable
    // carrier.) reset() moves the body immediately, so read the edges first.
    const { top, left, right } = b;
    const moveX = targetX - this.rect.x;
    const moveY = targetY - this.rect.y;
    b.reset(targetX, targetY); // gravity-free + immovable settings persist across reset

    const pb = scene.player && scene.player.body;
    if (
      pb &&
      pb.bottom <= top + 8 &&
      pb.bottom >= top - 10 &&
      pb.right > left &&
      pb.left < right &&
      pb.velocity.y >= -1
    ) {
      pb.x += moveX;
      pb.y += moveY;
    }
  }

  destroy(scene) {
    if (this.rect) {
      if (scene.movers) scene.movers.remove(this.rect, true, true);
      else this.rect.destroy();
      this.rect = null;
    }
  }
}
