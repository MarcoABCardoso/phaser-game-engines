/** @typedef {{ x: number, y: number, w: number, h: number, [key: string]: unknown }} RectSpec */
/** @typedef {{ width: number, height: number, [key: string]: unknown }} WorldSpec */
/** @typedef {{ x: number, y: number, [key: string]: unknown }} PointSpec */
/** @typedef {{ schemaVersion?: 1, type: string, id?: string, [key: string]: unknown }} EntitySpec */
/** @typedef {EntitySpec & { zone: RectSpec, to: string, entry?: PointSpec }} PortalSpec */
/** @typedef {{ schemaVersion?: 1, world: WorldSpec, spawn: PointSpec, entitySpecs?: EntitySpec[], [key: string]: unknown }} LevelSpec */

/** Identity helper that gives JavaScript content contextual TypeScript checking. @param {LevelSpec} level */
export function defineLevel(level) { return level; }
/** @param {EntitySpec} entity */
export function defineEntity(entity) { return entity; }
/** @param {PortalSpec} portal */
export function definePortal(portal) { return portal; }

