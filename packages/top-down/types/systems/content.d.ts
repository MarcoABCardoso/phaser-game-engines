export type TopDownLevel = import('@phaser-game-engines/core/content.js').LevelSpec & {
    walls?: import('@phaser-game-engines/core/content.js').RectSpec[];
    camera?: {
        deadzoneWidth?: number;
        deadzoneHeight?: number;
    };
};
/** @typedef {import('@phaser-game-engines/core/content.js').LevelSpec & { walls?: import('@phaser-game-engines/core/content.js').RectSpec[], camera?: { deadzoneWidth?: number, deadzoneHeight?: number } }} TopDownLevel */
/** Validate top-down level data without constructing Phaser resources.
 * @param {TopDownLevel} level
 * @param {{ path?: string, types?: any, validateExtension?: Function }} options
 * @returns {TopDownLevel}
 */
export declare function validateTopDownLevel(level: TopDownLevel, { path, types, validateExtension, }?: {
    path?: string;
    types?: any;
    validateExtension?: Function;
}): TopDownLevel;
