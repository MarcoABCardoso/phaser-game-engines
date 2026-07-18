import { describe, expect, it } from 'vitest';
import { ContentValidationError } from '@phaser-game-engines/core';
import { validatePlatformerLevel } from '@phaser-game-engines/platformer/headless';

describe('headless platformer content validation', () => {
  it('accepts level geometry and built-in entity types without Phaser', () => {
    const level = {
      world: { width: 640, height: 360 }, spawn: { x: 40, y: 280 },
      floorSegments: [{ x: 0, y: 320, w: 640, h: 40 }],
      platforms: [{ x: 200, y: 240, w: 120, h: 16 }],
      entitySpecs: [{ type: 'portal', id: 'exit', zone: { x: 600, y: 260, w: 40, h: 60 }, to: 'next' }],
    };
    expect(validatePlatformerLevel(level)).toBe(level);
  });

  it('reports the caller path and exact invalid geometry field', () => {
    expect(() => validatePlatformerLevel({
      world: { width: 640, height: 360 }, spawn: { x: 0, y: 0 },
      floorSegments: [{ x: 0, y: 320, w: 0, h: 40 }], entitySpecs: [],
    }, { path: 'levels/tutorial.json' })).toThrow(new ContentValidationError(
      'levels/tutorial.json.floorSegments[0].w', 'expected a positive finite number.',
    ));
  });
});

