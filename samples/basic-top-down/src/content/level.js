import { defineLevel } from '@phaser-game-engines/toolkit/core';

export const level = defineLevel({
  schemaVersion: 1,
  world: { width: 960, height: 540 }, spawn: { x: 90, y: 270 },
  walls: [
    { x: 300, y: 100, w: 32, h: 280 }, { x: 590, y: 180, w: 32, h: 280 },
  ],
  entitySpecs: [{ schemaVersion: 1, type: 'signal-goal', id: 'signal', x: 850, y: 270 }],
});
