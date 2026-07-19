import { validateLevel, validateRect } from '@phaser-game-engines/toolkit/core';
import { BASE_ENTITY_TYPES } from '../entities/registry.js';

/** @typedef {import('@phaser-game-engines/toolkit/core/content.js').LevelSpec & { floorSegments?: import('@phaser-game-engines/toolkit/core/content.js').RectSpec[], platforms?: import('@phaser-game-engines/toolkit/core/content.js').RectSpec[] }} PlatformerLevel */

/** Validate platformer level data without constructing Phaser resources.
 * @param {PlatformerLevel} level
 * @param {{ path?: string, types?: any, validateExtension?: Function }} options
 * @returns {PlatformerLevel}
 */
export function validatePlatformerLevel(level, {
  path = 'level', types, validateExtension,
} = {}) {
  const resolvedTypes = types ?? { ...BASE_ENTITY_TYPES, ...(level?.entityTypes ?? {}) };
  return validateLevel(level, {
    path,
    types: resolvedTypes,
    validateExtension(content, context) {
      for (const field of ['floorSegments', 'platforms']) {
        if (content[field] !== undefined && !Array.isArray(content[field])) {
          context.fail(`${path}.${field}`, 'expected an array.');
        }
        (content[field] ?? []).forEach((rect, index) => {
          validateRect(rect, { path: `${path}.${field}[${index}]` });
        });
      }
      validateExtension?.(content, context);
    },
  });
}
