/** Stable lifecycle names published by the real-time scene adapters. */
export declare const lifecycleEvent: Readonly<{
    ready: "ready";
    tick: "tick";
    shutdown: "shutdown";
}>;
/**
 * Create a small synchronous event channel for headless controllers and Phaser adapters.
 *
 * Listeners run in registration order. Adding a listener while an event is being
 * published affects the next publication; removing one takes effect immediately.
 */
export declare function createLifecycle(): Readonly<{
    on: (event: any, listener: any) => () => boolean;
    once: (event: any, listener: any) => () => boolean;
    emit: (event: any, payload: any) => number;
    clear: (event: any) => void;
}>;
