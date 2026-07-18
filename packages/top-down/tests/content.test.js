import { describe, expect, it } from 'vitest';
import { validateTopDownLevel } from '@phaser-game-engines/top-down/headless';

describe('headless top-down content validation', () => {
  it('accepts walls and validates built-in entity-specific fields', () => {
    const level = {
      world: { width: 640, height: 360 }, spawn: { x: 40, y: 40 },
      walls: [{ x: 0, y: 0, w: 640, h: 20 }],
      entitySpecs: [{
        type: 'interactable', id: 'sign', x: 80, y: 80,
        zone: { x: 60, y: 60, w: 40, h: 40 },
      }],
    };
    expect(validateTopDownLevel(level)).toBe(level);
  });

  it('reports exact wall paths without constructing a scene', () => {
    expect(() => validateTopDownLevel({
      world: { width: 640, height: 360 }, spawn: { x: 0, y: 0 },
      walls: [{ x: 0, y: 0, w: 10 }], entitySpecs: [],
    }, { path: 'maps/village.json' })).toThrow('maps/village.json.walls[0].h');
  });
});
