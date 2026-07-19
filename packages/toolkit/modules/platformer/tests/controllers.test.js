import { describe, expect, it } from 'vitest';
import { createInputIntent } from '@phaser-game-engines/toolkit/core';
import {
  createAreaTransitionController,
  createDashController,
  createLandingController,
  createLocomotionController,
  createTraversalController,
} from '@phaser-game-engines/toolkit/platformer/controllers';

const intent = (moveX = 0, actions = {}) => createInputIntent({ move: { x: moveX }, actions });

describe('headless platformer controllers', () => {
  it('locomotion returns motion commands without a Phaser body', () => {
    const controller = createLocomotionController();
    const result = controller.update({
      inputX: -1,
      onGround: true,
      stunned: false,
      inputLocked: false,
      dashing: false,
      dashDir: 1,
      velocityX: -120,
      config: { maxSpeed: 160, accel: 900, groundDragX: 1400, airDragX: 0, dashSpeed: 400 },
    });
    expect(result.motion).toEqual({ maxVelocityX: 160, dragX: 1400, accelerationX: -900 });
    expect(result.facingDir).toBe(-1);
    expect(result.sprinting).toBe(true);
  });

  it('dash can be installed and advanced independently', () => {
    const dash = createDashController();
    const config = { enabled: true, speed: 400, doubleTapMs: 260, durationMs: 170 };
    dash.update({ time: 1000, onGround: true, stunned: false, intent: intent(1, { moveRight: true }), config });
    const started = dash.update({
      time: 1200, onGround: true, stunned: false, intent: intent(1, { moveRight: true }), config,
    });
    expect(started).toMatchObject({ active: true, direction: 1, started: { dir: 1 } });
    expect(dash.snapshot().dashUntil).toBe(1370);
  });

  it('landing reports drop and latched impact velocity without assigning damage', () => {
    const landing = createLandingController();
    landing.reset(100);
    expect(landing.update({ y: 120, onGround: false, velocityY: 80 })).toBeNull();
    expect(landing.update({ y: 220, onGround: false, velocityY: 360 })).toBeNull();
    expect(landing.update({ y: 250, onGround: true, velocityY: 0 })).toEqual({
      drop: 150,
      impactVelocity: 360,
    });
  });

  it('area transitions reject overlap and expose a deterministic completion', () => {
    const areas = createAreaTransitionController();
    expect(areas.begin('cave', 'west')).toEqual({ areaId: 'cave', entryId: 'west' });
    expect(areas.active).toBe(true);
    expect(areas.begin('tower', 'base')).toBeNull();
    expect(areas.complete()).toEqual({ areaId: 'cave', entryId: 'west' });
    expect(areas.active).toBe(false);
  });
});

describe('composed traversal controller', () => {
  const body = (overrides = {}) => ({
    x: 20, y: 100, top: 80, bottom: 120, left: 7, right: 33,
    halfWidth: 13, halfHeight: 20,
    velocityX: 0, velocityY: 0, onGround: true,
    blockedLeft: false, blockedRight: false,
    ...overrides,
  });
  const config = (overrides = {}) => ({
    maxSpeed: 160,
    accel: 900,
    groundDragX: 1400,
    airDragX: 0,
    jumpVelocity: -420,
    airJumpCount: 0,
    coyoteMs: 0,
    jumpBufferMs: 0,
    fastFallGravity: 0,
    stunUntil: 0,
    dash: null,
    wall: null,
    ledge: null,
    ...overrides,
  });

  it('resolves a ground jump into a motion patch and fact', () => {
    const traversal = createTraversalController();
    traversal.reset(100);
    const result = traversal.step({
      time: 100,
      delta: 16,
      intent: intent(0, { jump: { pressed: true, down: true } }),
      body: body(),
      config: config(),
    });
    expect(result.motion.velocityY).toBe(-420);
    expect(result.events).toContainEqual({ type: 'jump', kind: 'ground' });
  });

  it('composes wall jump and locomotion without Phaser state', () => {
    const traversal = createTraversalController();
    traversal.reset(100);
    const result = traversal.step({
      time: 100,
      delta: 16,
      intent: intent(1, { jump: { pressed: true, down: true } }),
      body: body({ onGround: false, blockedRight: true, velocityY: 100 }),
      config: config({ wall: { jumpPushX: 280, lockMs: 150, slideSpeed: 90 } }),
    });
    expect(result.motion).toMatchObject({ velocityX: -280, velocityY: -420 });
    expect(result.events).toContainEqual({ type: 'jump', kind: 'wall' });
    expect(result.state.wallJumpLockUntil).toBe(250);
  });

  it('installs ledge traversal independently through configuration', () => {
    const traversal = createTraversalController();
    traversal.reset(100);
    const result = traversal.step({
      time: 100,
      delta: 16,
      intent: intent(1),
      body: body({ onGround: false, x: 187, left: 174, right: 200, top: 96, bottom: 136, velocityY: 20 }),
      solids: [{ x: 200, y: 100, w: 40, h: 300 }],
      config: config({ ledge: {} }),
    });
    expect(result.events[0]).toMatchObject({ type: 'ledgeGrab' });
    expect(result.motion).toMatchObject({ allowGravity: false, velocityX: 0, velocityY: 0 });
    expect(result.state.hanging).toEqual({ top: 100, faceX: 200, dir: 1 });
  });

  it('emits landing facts and leaves consequences to its consumer', () => {
    const traversal = createTraversalController();
    traversal.reset(100);
    traversal.step({
      time: 100, delta: 16, intent: intent(),
      body: body({ y: 160, onGround: false, velocityY: 300 }), config: config(),
    });
    const landed = traversal.step({
      time: 116, delta: 16, intent: intent(),
      body: body({ y: 240, onGround: true, velocityY: 0 }), config: config(),
    });
    expect(landed.events).toContainEqual({ type: 'land', drop: 140, impactVelocity: 300 });
  });

  it('returns a complete compatibility snapshot when reset', () => {
    const traversal = createTraversalController();
    expect(traversal.reset(75)).toMatchObject({
      facingDir: 1,
      groundY: 75,
      takeoffY: 75,
      wasAirborne: false,
      hanging: null,
      dashUntil: 0,
      dropThroughUntil: 0,
    });
  });
});
