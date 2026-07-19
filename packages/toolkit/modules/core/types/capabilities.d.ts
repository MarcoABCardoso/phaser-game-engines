/**
 * A small, schema-free capability bag.
 *
 * Capability values are deliberately opaque: a game may expose a function, an
 * adapter object, or plain data. Genre packages only query names they actually use.
 */
export declare function createCapabilities(initial?: {}): Readonly<{
    provide: (name: any, value?: boolean) => () => boolean;
    remove: (name: any, expectedValue: any) => boolean;
    has: (name: any) => boolean;
    get: (name: any) => any;
    entries: () => [any, any][];
}>;
/** Read a capability from either a capability bag or a plain capability object. */
export declare function getCapability(provider: any, name: any): any;
export declare function hasCapability(provider: any, name: any): any;
