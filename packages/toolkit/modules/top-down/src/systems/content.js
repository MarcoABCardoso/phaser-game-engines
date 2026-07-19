import { validateLevel, validateRect } from '@phaser-game-engines/toolkit/core';
import { BASE_ENTITY_TYPES } from '../entities/registry.js';

/** @typedef {import('@phaser-game-engines/toolkit/core/content.js').LevelSpec & { walls?: import('@phaser-game-engines/toolkit/core/content.js').RectSpec[], camera?: { deadzoneWidth?: number, deadzoneHeight?: number } }} TopDownLevel */

/** Validate top-down level data without constructing Phaser resources.
 * @param {TopDownLevel} level
 * @param {{ path?: string, types?: any, validateExtension?: Function }} options
 * @returns {TopDownLevel}
 */
export function validateTopDownLevel(level, {
  path = 'level', types, validateExtension,
} = {}) {
  const resolvedTypes = types ?? { ...BASE_ENTITY_TYPES, ...(level?.entityTypes ?? {}) };
  return validateLevel(level, {
    path,
    types: resolvedTypes,
    validateExtension(content, context) {
      if (content.walls !== undefined && !Array.isArray(content.walls)) {
        context.fail(`${path}.walls`, 'expected an array.');
      }
      (content.walls ?? []).forEach((wall, index) => {
        validateRect(wall, { path: `${path}.walls[${index}]` });
      });
      validateExtension?.(content, context);
    },
  });
}
