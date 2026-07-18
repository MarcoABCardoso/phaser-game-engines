export type PlatformerLevel = import('@phaser-game-engines/core/content.js').LevelSpec & {
    floorSegments?: import('@phaser-game-engines/core/content.js').RectSpec[];
    platforms?: import('@phaser-game-engines/core/content.js').RectSpec[];
};
/** @typedef {import('@phaser-game-engines/core/content.js').LevelSpec & { floorSegments?: import('@phaser-game-engines/core/content.js').RectSpec[], platforms?: import('@phaser-game-engines/core/content.js').RectSpec[] }} PlatformerLevel */
/** Validate platformer level data without constructing Phaser resources.
 * @param {PlatformerLevel} level
 * @param {{ path?: string, types?: any, validateExtension?: Function }} options
 * @returns {PlatformerLevel}
 */
export declare function validatePlatformerLevel(level: PlatformerLevel, { path, types, validateExtension, }?: {
    path?: string;
    types?: any;
    validateExtension?: Function;
}): PlatformerLevel;
