export declare function createEntityRegistry(initial?: {}): Readonly<{
    register: (name: any, EntityType: any) => () => boolean;
    has: (name: any) => boolean;
    get: (name: any) => any;
    entries: () => [any, any][];
    toObject: () => any;
}>;
/** Shared headless entity state; Phaser objects remain owned by genre subclasses. */
export declare class WorldEntity {
    id: any;
    spec: {};
    capabilities: Readonly<{
        provide: (name: any, value?: boolean) => () => boolean;
        remove: (name: any, expectedValue: any) => boolean;
        has: (name: any) => boolean;
        get: (name: any) => any;
        entries: () => [any, any][];
    }>;
    resources: Readonly<{
        own: (resource: any, cleanup: any) => () => boolean;
        clear: () => boolean;
        readonly closed: boolean;
        readonly size: number;
    }>;
    constructor(spec?: {});
    get goneFlag(): any;
    isGone(save: any): boolean;
    spawn(): void;
    update(): void;
    destroy(): void;
}
/** Shared deterministic construction, scheduling, querying, and teardown. */
export declare class EntityStore {
    registry: {};
    list: any[];
    constructor(types?: {});
    createEntity(spec: any, path?: string): any;
    build(host: any, specs?: any[]): void;
    spawn(host: any, entity: any): any;
    spawnFromSpec(host: any, spec: any): any;
    update(host: any, time: any, delta: any): void;
    despawn(host: any, entityOrId: any): boolean;
    destroyAll(host: any): void;
    withCapability(name: any, predicate?: null): any[];
    firstWithCapability(name: any, predicate?: null): any;
    get(id: any): any;
    byGoneFlag(flag: any): any;
    query(predicate: any): any[];
    inRect(rect: any, getPoint: any): any[];
}
/** Edge-triggered zone state shared by portals and other trigger volumes. */
export declare function createTriggerZone(zone: any, { initiallyArmed }?: {
    initiallyArmed?: boolean | undefined;
}): Readonly<{
    update(point: any): {
        inside: boolean;
        entered: boolean;
        exited: boolean;
        triggered: boolean;
    };
    reset(nextArmed?: boolean): void;
    readonly armed: boolean;
}>;
export declare function createWorldRuntime({ types, EntityStoreType, clock, rng, snapshots, }?: {
    EntityStoreType?: typeof EntityStore | undefined;
    types?: {} | undefined;
}): Readonly<{
    registry: {};
    entities: EntityStore;
    clock: any;
    rng: Readonly<{
        next(): any;
    }>;
    snapshots: Readonly<{
        version: number;
        serialize: (source: any) => {
            version: number;
            data: any;
        };
        deserialize: (snapshot: any, target: any) => any;
    }>;
    validateLevel: (level: any, options?: {}) => any;
}>;
