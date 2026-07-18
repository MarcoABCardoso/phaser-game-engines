/** @typedef {{ x: number, y: number, w: number, h: number, [key: string]: unknown }} RectSpec */
/** @typedef {{ width: number, height: number, [key: string]: unknown }} WorldSpec */
/** @typedef {{ x: number, y: number, [key: string]: unknown }} PointSpec */
/** @typedef {{ schemaVersion?: 1, type: string, id?: string, [key: string]: unknown }} EntitySpec */
/** @typedef {EntitySpec & { zone: RectSpec, to: string, entry?: PointSpec }} PortalSpec */
/** @typedef {{ schemaVersion?: 1, world: WorldSpec, spawn: PointSpec, entitySpecs?: EntitySpec[], [key: string]: unknown }} LevelSpec */
export type RectSpec = {
    x: number;
    y: number;
    w: number;
    h: number;
    [key: string]: unknown;
};
export type WorldSpec = {
    width: number;
    height: number;
    [key: string]: unknown;
};
export type PointSpec = {
    x: number;
    y: number;
    [key: string]: unknown;
};
export type EntitySpec = {
    schemaVersion?: 1;
    type: string;
    id?: string;
    [key: string]: unknown;
};
export type PortalSpec = EntitySpec & {
    zone: RectSpec;
    to: string;
    entry?: PointSpec;
};
export type LevelSpec = {
    schemaVersion?: 1;
    world: WorldSpec;
    spawn: PointSpec;
    entitySpecs?: EntitySpec[];
    [key: string]: unknown;
};
/** Identity helper that gives JavaScript content contextual TypeScript checking. @param {LevelSpec} level */
export declare function defineLevel(level: LevelSpec): LevelSpec;
/** @param {EntitySpec} entity */
export declare function defineEntity(entity: EntitySpec): EntitySpec;
/** @param {PortalSpec} portal */
export declare function definePortal(portal: PortalSpec): PortalSpec;
