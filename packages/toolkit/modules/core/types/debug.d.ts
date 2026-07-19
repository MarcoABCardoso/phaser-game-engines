/** Collect lifecycle/battle events in a bounded, inspectable log. */
export declare function createDebugEventLog({ limit }?: {
    limit?: number | undefined;
}): Readonly<{
    emit(type: any, payload: any): void;
    clear: () => void;
    snapshot: () => any[];
}>;
export declare function inspectCapabilities(provider: any): any;
export declare function inspectContextualActions(actions?: any[], context?: {}): {
    index: number;
    id: any;
    label: any;
    priority: any;
    available: boolean;
}[];
/** Produce JSON-friendly state for any controller with `state` or `debugState()`. */
export declare function inspectController(controller: any): any;
/** Optional development-only text overlay; no Phaser import is required. */
export declare function createDebugOverlayMechanic(options?: {}): (scene: any) => () => void;
