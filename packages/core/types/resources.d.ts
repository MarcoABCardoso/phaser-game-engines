/** Run every cleanup even when earlier callbacks fail. */
export declare function runCleanups(cleanups: any, message?: string): void;
/** Own cleanup callbacks for listeners, bodies, timers, and other external resources. */
export declare function createResourceScope(): Readonly<{
    own: (resource: any, cleanup: any) => () => boolean;
    clear: () => boolean;
    readonly closed: boolean;
    readonly size: number;
}>;
