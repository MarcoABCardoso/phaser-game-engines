import { actionState } from '@phaser-game-engines/core';
import { findGrabbableLedge, registerTap, resolveJump } from '../systems/movement.js';

const DEFAULTS = Object.freeze({
  dashDoubleTapMs: 260,
  dashDurationMs: 170,
  dashCooldownMs: 480,
  dropThroughMs: 220,
  jumpCutMultiplier: 0.45,
  wallSlideSpeed: 120,
  wallJumpPushX: 300,
  wallJumpLockMs: 160,
  ledgeReach: 12,
  ledgeBand: 20,
  ledgeCooldownMs: 300,
});

/** Headless horizontal locomotion. Returns an Arcade-agnostic motion patch. */
export function createLocomotionController() {
  let facingDir = 1;
  return {
    reset() { facingDir = 1; },
    update({ inputX, onGround, stunned, inputLocked, dashing, dashDir, velocityX, config }) {
      const left = inputX < 0;
      const right = inputX > 0;
      if (dashing) facingDir = dashDir;
      else if (left && !right) facingDir = -1;
      else if (right && !left) facingDir = 1;

      const motion = {};
      if (dashing) {
        motion.maxVelocityX = Math.max(config.maxSpeed, config.dashSpeed);
        motion.velocityX = dashDir * config.dashSpeed;
        motion.accelerationX = 0;
        motion.dragX = 0;
      } else {
        motion.maxVelocityX = config.maxSpeed;
        motion.dragX = onGround ? config.groundDragX : config.airDragX;
        if (!stunned && !inputLocked && left !== right) {
          motion.accelerationX = (right ? 1 : -1) * config.accel;
        } else {
          motion.accelerationX = 0;
        }
      }
      return {
        motion,
        facingDir,
        sprinting: !dashing && onGround && Math.abs(velocityX) >= 0.6 * config.maxSpeed,
      };
    },
    snapshot() { return { facingDir }; },
  };
}

/** Headless double-tap dash state and air-dash budget. */
export function createDashController() {
  let tapState = null;
  let until = 0;
  let cooldownUntil = 0;
  let direction = 1;
  let airDashesUsed = 0;

  return {
    reset() {
      tapState = null;
      until = 0;
      cooldownUntil = 0;
      direction = 1;
      airDashesUsed = 0;
    },
    update({ time, onGround, stunned, intent, config }) {
      if (onGround) airDashesUsed = 0;
      let started = null;
      if (!stunned && config?.enabled) {
        const edges = [
          [-1, actionState(intent, 'moveLeft').pressed],
          [1, actionState(intent, 'moveRight').pressed],
        ];
        for (const [dir, pressed] of edges) {
          if (!pressed) continue;
          const tap = registerTap(tapState, dir, time, config.doubleTapMs ?? DEFAULTS.dashDoubleTapMs);
          tapState = tap.state;
          if (!tap.dashed || time < cooldownUntil) continue;
          if (!onGround) {
            if (!config.airborne || airDashesUsed >= (config.airDashes ?? 1)) continue;
            airDashesUsed += 1;
          }
          direction = dir;
          until = time + (config.durationMs ?? DEFAULTS.dashDurationMs);
          cooldownUntil = until + (config.cooldownMs ?? DEFAULTS.dashCooldownMs);
          started = {
            dir,
            invincibleMs: config.iFrames
              ? (config.iFrameMs ?? config.durationMs ?? DEFAULTS.dashDurationMs)
              : 0,
          };
        }
      }
      return { active: time < until, direction, started };
    },
    cancel(time) { until = Math.min(until, time); },
    snapshot() { return { dashUntil: until, dashCooldownUntil: cooldownUntil, dashDir: direction, airDashesUsed }; },
  };
}

/** Headless jump buffering, coyote time, air-jump budget, and jump cutting. */
export function createJumpController() {
  let airJumpsUsed = 0;
  let coyoteUntil = 0;
  let bufferedUntil = 0;
  let heldLastFrame = false;

  return {
    reset() {
      airJumpsUsed = 0;
      coyoteUntil = 0;
      bufferedUntil = 0;
      heldLastFrame = false;
    },
    update({ time, intent, onGround, onOneWay, wallDir, wallEnabled, velocityY, stunned, config }) {
      if (onGround) {
        airJumpsUsed = 0;
        coyoteUntil = time + config.coyoteMs;
      }
      const pressed = actionState(intent, 'jump').pressed;
      const held = actionState(intent, 'jump').down;
      const down = actionState(intent, 'down').down;
      if (pressed) bufferedUntil = time + config.bufferMs;
      const queued = pressed || time < bufferedUntil;
      let kind = 'none';
      const motion = {};
      let dropThroughUntil;

      if (!stunned && queued) {
        kind = resolveJump({
          onGround,
          coyoteOk: time < coyoteUntil,
          dropRequested: down,
          onOneWay,
          touchingWallDir: wallDir,
          wallJumpEnabled: wallEnabled,
          airJumpsUsed,
          airJumpAllowance: config.airJumpCount,
        });
        if (kind === 'drop') {
          dropThroughUntil = time + config.dropThroughMs;
        } else if (kind === 'ground') {
          motion.velocityY = config.jumpVelocity;
          coyoteUntil = 0;
        } else if (kind === 'wall') {
          motion.velocityY = config.jumpVelocity;
          airJumpsUsed = 0;
        } else if (kind === 'air') {
          motion.velocityY = config.jumpVelocity;
          airJumpsUsed += 1;
        }
        if (kind !== 'none') bufferedUntil = 0;
      }

      if (kind === 'none' && !held && heldLastFrame && velocityY < 0) {
        motion.velocityY = velocityY * config.cutMultiplier;
      }
      heldLastFrame = held;
      return { kind, motion, dropThroughUntil, down, queued };
    },
    consumeBuffer() { bufferedUntil = 0; },
    snapshot() { return { airJumpsUsed, coyoteUntil, jumpBufferedUntil: bufferedUntil, jumpHeldLastFrame: heldLastFrame }; },
  };
}

/** Headless wall-slide decision and post-wall-jump input lock. */
export function createWallTraversalController() {
  let lockUntil = 0;
  let sliding = false;
  return {
    reset() { lockUntil = 0; sliding = false; },
    update({ time, onGround, wallDir, inputX, velocityY, config }) {
      const pressingWall = (wallDir === -1 && inputX < 0) || (wallDir === 1 && inputX > 0);
      sliding = Boolean(config) && !onGround && wallDir !== 0 && pressingWall && velocityY > 0;
      return {
        sliding,
        inputLocked: time < lockUntil,
        velocityY: sliding && velocityY > (config.slideSpeed ?? DEFAULTS.wallSlideSpeed)
          ? (config.slideSpeed ?? DEFAULTS.wallSlideSpeed)
          : undefined,
      };
    },
    startJump(time, wallDir, config) {
      lockUntil = time + (config.lockMs ?? DEFAULTS.wallJumpLockMs);
      sliding = false;
      return { velocityX: -wallDir * (config.jumpPushX ?? DEFAULTS.wallJumpPushX) };
    },
    snapshot() { return { wallJumpLockUntil: lockUntil, wallSliding: sliding }; },
  };
}

/** Headless ledge selection and hang/mantle state. */
export function createLedgeTraversalController() {
  let hanging = null;
  let cooldownUntil = 0;
  return {
    reset() { hanging = null; cooldownUntil = 0; },
    update({ time, inputX, down, jumpQueued, onGround, dashing, body, solids, config }) {
      if (hanging) {
        const motion = { allowGravity: false, velocityX: 0, velocityY: 0, accelerationX: 0, gravityY: 0 };
        if (jumpQueued) {
          motion.allowGravity = true;
          motion.reset = {
            x: hanging.faceX + hanging.dir * (body.halfWidth + 3),
            y: hanging.top - body.halfHeight - 1,
          };
          const ledge = hanging;
          hanging = null;
          cooldownUntil = time + (config?.cooldownMs ?? DEFAULTS.ledgeCooldownMs);
          return { motion, event: { type: 'mantle', ledge }, hanging };
        }
        if (down) {
          const ledge = hanging;
          hanging = null;
          cooldownUntil = time + (config?.cooldownMs ?? DEFAULTS.ledgeCooldownMs);
          motion.allowGravity = true;
          return { motion, event: { type: 'ledgeDrop', ledge }, hanging };
        }
        return { motion, event: null, hanging };
      }

      if (!config || dashing || onGround || time < cooldownUntil || body.velocityY < -20) {
        return { motion: {}, event: null, hanging };
      }
      const dir = inputX > 0 ? 1 : inputX < 0 ? -1 : 0;
      if (!dir) return { motion: {}, event: null, hanging };
      const ledge = findGrabbableLedge({
        playerTop: body.top,
        playerBottom: body.bottom,
        playerLeft: body.left,
        playerRight: body.right,
        dir,
        solids,
        reach: config.reach ?? DEFAULTS.ledgeReach,
        band: config.band ?? DEFAULTS.ledgeBand,
      });
      if (!ledge) return { motion: {}, event: null, hanging };
      hanging = ledge;
      return {
        motion: { allowGravity: false, velocityX: 0, velocityY: 0, accelerationX: 0, gravityY: 0 },
        event: { type: 'ledgeGrab', ledge },
        hanging,
      };
    },
    release(time, cooldownMs = DEFAULTS.ledgeCooldownMs) {
      hanging = null;
      cooldownUntil = time + cooldownMs;
    },
    snapshot() { return { hanging, ledgeCooldownUntil: cooldownUntil }; },
  };
}

/** Reports landings without assigning damage, health, or failure semantics. */
export function createLandingController() {
  let groundY = 0;
  let takeoffY = 0;
  let airborne = false;
  let impactVelocity = 0;
  return {
    reset(y = 0) { groundY = y; takeoffY = y; airborne = false; impactVelocity = 0; },
    freezeAt(y) { groundY = y; takeoffY = y; airborne = false; impactVelocity = 0; },
    update({ y, onGround, velocityY }) {
      if (!onGround) {
        if (!airborne) takeoffY = groundY;
        airborne = true;
        impactVelocity = Math.max(impactVelocity, velocityY);
        return null;
      }
      let landing = null;
      if (airborne) landing = { drop: y - takeoffY, impactVelocity };
      groundY = y;
      airborne = false;
      impactVelocity = 0;
      return landing;
    },
    snapshot() { return { groundY, takeoffY, wasAirborne: airborne }; },
  };
}

/**
 * Compose the traversal abilities into one deterministic step. Each individual
 * controller can also be used alone by games with a different physics adapter.
 */
export function createTraversalController(overrides = {}) {
  const locomotion = overrides.locomotion ?? createLocomotionController();
  const dash = overrides.dash ?? createDashController();
  const jump = overrides.jump ?? createJumpController();
  const wall = overrides.wall ?? createWallTraversalController();
  const ledge = overrides.ledge ?? createLedgeTraversalController();
  const landing = overrides.landing ?? createLandingController();
  let dropThroughUntil = 0;
  let onOneWay = false;

  function snapshot() {
    return {
      ...locomotion.snapshot(), ...dash.snapshot(), ...jump.snapshot(),
      ...wall.snapshot(), ...ledge.snapshot(), ...landing.snapshot(),
      dropThroughUntil,
      onOneWay,
    };
  }

  function reset(y = 0) {
    locomotion.reset(); dash.reset(); jump.reset(); wall.reset(); ledge.reset(); landing.reset(y);
    dropThroughUntil = 0;
    onOneWay = false;
    return snapshot();
  }

  function step({ time, delta, intent, body, onOneWay: oneWayContact = false, solids = [], config }) {
    onOneWay = oneWayContact;
    const events = [];
    const motion = {};
    if (ledge.snapshot().hanging) {
      const ledgeResult = ledge.update({
        time,
        inputX: intent.move.x,
        down: actionState(intent, 'down').down,
        jumpQueued: actionState(intent, 'jump').pressed,
        onGround: body.onGround,
        dashing: false,
        body,
        solids,
        config: config.ledge,
      });
      Object.assign(motion, ledgeResult.motion);
      if (ledgeResult.event) {
        events.push(ledgeResult.event);
        if (ledgeResult.event.type === 'mantle') {
          landing.freezeAt(ledgeResult.motion.reset.y);
          jump.consumeBuffer();
        }
      }
      return {
        motion,
        events,
        state: {
          ...locomotion.snapshot(), ...dash.snapshot(), ...jump.snapshot(),
          ...wall.snapshot(), ...ledge.snapshot(), ...landing.snapshot(),
          dropThroughUntil,
          onOneWay,
        },
      };
    }
    const stunned = time < (config.stunUntil ?? 0);
    const wallDir = body.blockedLeft ? -1 : body.blockedRight ? 1 : 0;
    const wallResult = wall.update({
      time, onGround: body.onGround, wallDir, inputX: intent.move.x,
      velocityY: body.velocityY, config: config.wall,
    });
    if (wallResult.velocityY !== undefined) motion.velocityY = wallResult.velocityY;

    const dashResult = dash.update({ time, onGround: body.onGround, stunned, intent, config: config.dash });
    if (dashResult.started) events.push({ type: 'dash', ...dashResult.started });

    const jumpResult = jump.update({
      time, intent, onGround: body.onGround, onOneWay, wallDir,
      wallEnabled: Boolean(config.wall), velocityY: body.velocityY, stunned,
      config: {
        coyoteMs: config.coyoteMs,
        bufferMs: config.jumpBufferMs,
        airJumpCount: config.airJumpCount,
        jumpVelocity: config.jumpVelocity,
        dropThroughMs: config.dropThroughMs ?? DEFAULTS.dropThroughMs,
        cutMultiplier: config.jumpCutMultiplier ?? DEFAULTS.jumpCutMultiplier,
      },
    });
    if (jumpResult.dropThroughUntil !== undefined) dropThroughUntil = jumpResult.dropThroughUntil;
    if (jumpResult.kind !== 'none') {
      events.push({ type: 'jump', kind: jumpResult.kind });
      dash.cancel(time);
    }

    const dashing = jumpResult.kind === 'none' && dashResult.active;
    const locomotionResult = locomotion.update({
      inputX: intent.move.x, onGround: body.onGround, stunned,
      inputLocked: wallResult.inputLocked, dashing, dashDir: dashResult.direction,
      velocityX: body.velocityX,
      config: {
        maxSpeed: config.maxSpeed,
        accel: config.accel,
        groundDragX: config.groundDragX,
        airDragX: config.airDragX,
        dashSpeed: config.dash?.speed ?? config.maxSpeed,
      },
    });
    Object.assign(motion, locomotionResult.motion, jumpResult.motion);
    if (jumpResult.kind === 'wall') Object.assign(motion, wall.startJump(time, wallDir, config.wall));
    if (!dashing && !body.onGround && jumpResult.down && config.fastFallGravity > 0) {
      motion.gravityY = config.fastFallGravity;
    } else {
      motion.gravityY = 0;
    }

    const ledgeResult = ledge.update({
      time, inputX: intent.move.x, down: jumpResult.down, jumpQueued: jumpResult.queued,
      onGround: body.onGround, dashing: dashing || jumpResult.kind !== 'none',
      body, solids, config: config.ledge,
    });
    if (ledgeResult.event) {
      events.push(ledgeResult.event);
      Object.assign(motion, ledgeResult.motion);
      if (ledgeResult.event.type === 'ledgeGrab' || ledgeResult.event.type === 'mantle') {
        landing.freezeAt(ledgeResult.motion.reset?.y ?? body.y);
        jump.consumeBuffer();
      }
    }

    const suppressLanding = ledgeResult.hanging || Boolean(ledgeResult.event);
    const landed = suppressLanding ? null : landing.update({
      y: ledgeResult.motion.reset?.y ?? body.y,
      onGround: body.onGround,
      velocityY: body.velocityY,
    });
    if (landed) events.push({ type: 'land', ...landed });
    if (locomotionResult.sprinting) events.push({ type: 'sprint', delta: delta / 1000 });

    return {
      motion,
      events,
      state: {
        ...locomotion.snapshot(), ...dash.snapshot(), ...jump.snapshot(),
        ...wall.snapshot(), ...ledge.snapshot(), ...landing.snapshot(),
        dropThroughUntil,
        onOneWay,
      },
    };
  }

  return Object.freeze({ reset, step, snapshot, locomotion, dash, jump, wall, ledge, landing });
}
