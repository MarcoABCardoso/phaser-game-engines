import { describe, expect, it } from 'vitest';

describe('documented headless package entry points', () => {
  it('load in Node without evaluating Phaser or browser globals', async () => {
    const [core, platformer, topDown, battle] = await Promise.all([
      import('@phaser-game-engines/core/headless'),
      import('@phaser-game-engines/platformer/headless'),
      import('@phaser-game-engines/top-down/headless'),
      import('@phaser-game-engines/turn-based-battle/headless'),
    ]);

    expect(core.createWorldRuntime).toBeTypeOf('function');
    expect(platformer.createTraversalController).toBeTypeOf('function');
    expect(topDown.movementFromIntent).toBeTypeOf('function');
    expect(battle.Battle).toBeTypeOf('function');
  });
});

