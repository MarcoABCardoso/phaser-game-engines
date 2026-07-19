/** Select the highest-priority available action without mutating the offered list. */
export declare function selectContextualAction(actions?: any[], context?: {}): any;
/** Execute an action only if it is still available in the current context. */
export declare function executeContextualAction(action: any, context?: {}): {
    executed: boolean;
    value: any;
};
/**
 * Advance press/hold activation for the selected action.
 *
 * Actions default to `{ action: 'interact', mode: 'press' }`. A hold action may
 * declare `{ mode: 'hold', durationMs: 600 }`. The returned state is passed back
 * on the next frame; `triggered` fires only once until the input is released.
 */
export declare function advanceActionActivation(action: any, state: any, intent: any, delta?: number): {
    state: null;
    triggered: boolean;
    progress: number;
} | {
    state: {
        key: any;
        heldMs: number;
        fired: boolean;
    };
    triggered: any;
    progress: number;
} | {
    state: {
        key: any;
        heldMs: any;
        fired: any;
    };
    triggered: boolean;
    progress: number;
};
