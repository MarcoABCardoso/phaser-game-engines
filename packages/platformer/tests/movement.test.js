import { describe, it, expect } from 'vitest';
import {
  shouldCollideOneWay,
  registerTap,
  resolveJump,
  findGrabbableLedge,
} from '@phaser-game-engines/platformer/systems/movement.js';

describe('one-way (thin) platform collision', () => {
  const base = { velocityY: 10, prevBottom: 100, platformTop: 100, grace: 8 };

  it('lands when descending onto the top (feet were on/above it last frame)', () => {
    expect(shouldCollideOneWay(base)).toBe(true);
    expect(shouldCollideOneWay({ ...base, prevBottom: 96 })).toBe(true); // slightly above
  });

  it('passes up through from below (rising)', () => {
    expect(shouldCollideOneWay({ ...base, velocityY: -50 })).toBe(false);
  });

  it('passes through while deliberately dropping, even when descending onto the top', () => {
    expect(shouldCollideOneWay({ ...base, dropping: true })).toBe(false);
  });

  it('does not snag when the feet were already well below the top (fell past it)', () => {
    expect(shouldCollideOneWay({ ...base, prevBottom: 140 })).toBe(false);
  });

  it('respects the grace band so resting contact still registers', () => {
    expect(shouldCollideOneWay({ ...base, prevBottom: 108 })).toBe(true); // exactly top+grace
    expect(shouldCollideOneWay({ ...base, prevBottom: 109 })).toBe(false); // just past it
  });
});

describe('dash double-tap detection', () => {
  it('a single tap arms but does not dash', () => {
    const { state, dashed } = registerTap(null, 1, 1000, 260);
    expect(dashed).toBe(false);
    expect(state).toEqual({ dir: 1, at: 1000 });
  });

  it('a second same-direction tap within the window dashes', () => {
    const first = registerTap(null, 1, 1000, 260);
    const second = registerTap(first.state, 1, 1200, 260);
    expect(second.dashed).toBe(true);
  });

  it('a second tap after the window only re-arms', () => {
    const first = registerTap(null, 1, 1000, 260);
    const second = registerTap(first.state, 1, 1400, 260);
    expect(second.dashed).toBe(false);
    expect(second.state).toEqual({ dir: 1, at: 1400 });
  });

  it('the opposite direction re-arms instead of dashing', () => {
    const first = registerTap(null, 1, 1000, 260);
    const second = registerTap(first.state, -1, 1100, 260);
    expect(second.dashed).toBe(false);
    expect(second.state).toEqual({ dir: -1, at: 1100 });
  });

  it('clears after a dash so a held third tap cannot chain', () => {
    const first = registerTap(null, 1, 1000, 260);
    const second = registerTap(first.state, 1, 1100, 260);
    const third = registerTap(second.state, 1, 1150, 260);
    expect(second.dashed).toBe(true);
    expect(third.dashed).toBe(false);
  });
});

describe('jump resolution priority', () => {
  const budget = { airJumpsUsed: 0, airJumpAllowance: 1 };

  it('drops through when down is held on a one-way platform', () => {
    expect(resolveJump({ onGround: true, dropRequested: true, onOneWay: true, ...budget })).toBe('drop');
  });

  it('down on solid ground is a normal jump, not a drop', () => {
    expect(resolveJump({ onGround: true, dropRequested: true, onOneWay: false, ...budget })).toBe('ground');
  });

  it('jumps normally from the ground', () => {
    expect(resolveJump({ onGround: true, dropRequested: false, onOneWay: false, ...budget })).toBe('ground');
  });

  it('air-jumps when airborne with budget remaining', () => {
    expect(resolveJump({ onGround: false, dropRequested: false, onOneWay: false, ...budget })).toBe('air');
  });

  it('does nothing airborne once the air-jump budget is spent', () => {
    expect(
      resolveJump({ onGround: false, dropRequested: false, onOneWay: false, airJumpsUsed: 1, airJumpAllowance: 1 }),
    ).toBe('none');
  });

  it('does nothing airborne when air jumps are disabled (allowance 0)', () => {
    expect(
      resolveJump({ onGround: false, dropRequested: false, onOneWay: false, airJumpsUsed: 0, airJumpAllowance: 0 }),
    ).toBe('none');
  });

  it('ground-jumps during the coyote window even when airborne', () => {
    expect(
      resolveJump({ onGround: false, coyoteOk: true, dropRequested: false, onOneWay: false, ...budget }),
    ).toBe('ground');
  });

  it('wall-jumps when clinging to a wall (airborne, no coyote, wall jump enabled)', () => {
    expect(
      resolveJump({
        onGround: false, coyoteOk: false, dropRequested: false, onOneWay: false,
        touchingWallDir: 1, wallJumpEnabled: true, airJumpsUsed: 0, airJumpAllowance: 0,
      }),
    ).toBe('wall');
  });

  it('prefers a ground/coyote jump over a wall jump', () => {
    expect(
      resolveJump({
        onGround: false, coyoteOk: true, dropRequested: false, onOneWay: false,
        touchingWallDir: 1, wallJumpEnabled: true, ...budget,
      }),
    ).toBe('ground');
  });

  it('ignores walls when wall jump is disabled, falling through to an air jump', () => {
    expect(
      resolveJump({
        onGround: false, dropRequested: false, onOneWay: false,
        touchingWallDir: 1, wallJumpEnabled: false, ...budget,
      }),
    ).toBe('air');
  });
});

describe('ledge grab geometry', () => {
  // A wall whose top is level with the player's hands, just to the player's right.
  const solids = [{ x: 200, y: 100, w: 40, h: 300 }];
  const player = { playerTop: 96, playerBottom: 136, playerLeft: 174, playerRight: 200, dir: 1 };

  it('grabs a ledge at hand height on the reached-toward side', () => {
    const ledge = findGrabbableLedge({ ...player, solids });
    expect(ledge).toEqual({ top: 100, faceX: 200, dir: 1 });
  });

  it('does not grab when the wall face is out of horizontal reach', () => {
    expect(findGrabbableLedge({ ...player, playerRight: 150, playerLeft: 124, solids })).toBeNull();
  });

  it('does not grab when the ledge top is far above or below the hands', () => {
    expect(findGrabbableLedge({ ...player, solids: [{ x: 200, y: 300, w: 40, h: 100 }] })).toBeNull();
  });

  it('does not grab a wall on the side the player is not reaching toward', () => {
    // Wall is to the right, but the player is reaching left.
    expect(findGrabbableLedge({ ...player, dir: -1, solids })).toBeNull();
  });

  it('requires a direction (no grab with dir 0)', () => {
    expect(findGrabbableLedge({ ...player, dir: 0, solids })).toBeNull();
  });
});
