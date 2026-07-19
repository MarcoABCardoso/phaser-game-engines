export declare const WORLD_SCHEMA_VERSION = 1;
export declare const ENTITY_SCHEMA_VERSION = 1;
export declare class ContentValidationError extends TypeError {
    path: any;
    constructor(path: any, message: any);
}
declare function fail(path: any, message: any): void;
export declare function validateRect(rect: any, { path, positiveSize }?: {
    path?: string | undefined;
    positiveSize?: boolean | undefined;
}): any;
export declare function validatePortalSpec(spec: any, { path, fail: report }?: {
    fail?: typeof fail | undefined;
    path?: string | undefined;
}): any;
export declare function validateEntitySpec(spec: any, { path, types }?: {
    path?: string | undefined;
}): any;
export declare function validateLevel(level: any, { path, types, validateExtension }?: {
    path?: string | undefined;
}): any;
export {};
