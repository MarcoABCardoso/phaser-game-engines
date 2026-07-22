import { defineLevel } from '@phaser-game-engines/toolkit/core';

export const world = defineLevel({
  schemaVersion: 1,
  world: { width: 960, height: 540 },
  spawn: { x: 110, y: 270 },
  walls: [
    { x: 260, y: 80, w: 32, h: 230 },
    { x: 690, y: 230, w: 32, h: 230 },
  ],
  entitySpecs: [{
    schemaVersion: 1,
    type: 'battle-encounter',
    id: 'training-drone',
    x: 580,
    y: 270,
    label: 'Training drone',
    playerResolve: 5,
    rivalResolve: 5,
  }],
});
