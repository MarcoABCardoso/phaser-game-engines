import { defineLevel } from '@phaser-game-engines/toolkit/core';

export const level = defineLevel({
  schemaVersion: 1,
  world: { width: 960, height: 540 }, spawn: { x: 70, y: 430 },
  floorSegments: [{ x: 0, y: 500, w: 960, h: 40 }],
  platforms: [{ x: 260, y: 420, w: 150, h: 20 }, { x: 520, y: 350, w: 150, h: 20 }],
  entitySpecs: [{ schemaVersion: 1, type: 'signal-goal', id: 'signal', x: 865, y: 440 }],
});
