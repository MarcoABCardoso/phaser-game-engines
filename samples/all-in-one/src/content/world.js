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
    enemies: [
      { id: 'drone-alpha', label: 'Drone Alpha', hp: 6, maxHp: 6, attack: 4, defense: 2, color: 0xef4444 },
      { id: 'drone-beta', label: 'Drone Beta', hp: 6, maxHp: 6, attack: 4, defense: 1, color: 0xf97316 },
    ],
  }, {
    schemaVersion: 1, type: 'collectible', id: 'field-tonic', item: 'tonic', label: 'Tonic',
    x: 190, y: 150, color: 0x22c55e,
  }, {
    schemaVersion: 1, type: 'collectible', id: 'rusty-sword', item: 'sword', label: 'Rusty sword',
    x: 420, y: 380, color: 0xf59e0b,
  }, {
    schemaVersion: 1, type: 'collectible', id: 'sky-charm', item: 'charm', label: 'Sky charm',
    x: 820, y: 120, color: 0x38bdf8,
  }],
});
