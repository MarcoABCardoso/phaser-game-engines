import { describe, expect, it } from 'vitest';

describe('documented headless package entry points', () => {
  it('load in Node without evaluating Phaser or browser globals', async () => {
    const [core, platformer, topDown, battle] = await Promise.all([
      import('@phaser-game-engines/toolkit/core/headless'),
      import('@phaser-game-engines/toolkit/platformer/headless'),
      import('@phaser-game-engines/toolkit/top-down/headless'),
      import('@phaser-game-engines/toolkit/battle/headless'),
    ]);

    expect(core.createWorldRuntime).toBeTypeOf('function');
    expect(platformer.createTraversalController).toBeTypeOf('function');
    expect(topDown.movementFromIntent).toBeTypeOf('function');
    expect(battle.Battle).toBeTypeOf('function');
  });
});

