export type InputActionState = {
    pressed: boolean;
    down: boolean;
    released: boolean;
};
export type InputActionSource = boolean | Partial<InputActionState>;
export type InputIntentSource = {
    move?: {
        x?: number;
        y?: number;
    };
    actions?: Record<string, InputActionSource>;
    meta?: Record<string, unknown>;
};
export type InputIntent = {
    move: {
        x: number;
        y: number;
    };
    actions: Record<string, InputActionState>;
    meta: Record<string, unknown>;
};
/**
 * Build the canonical input shape consumed by headless controllers and scenes.
 * Movement is clamped to a unit circle so digital and analog sources share the
 * same maximum magnitude. Action names are deliberately game-defined.
 */
/** @param {InputIntentSource} source @returns {InputIntent} */
export declare function createInputIntent({ move, actions, meta }?: InputIntentSource): InputIntent;
export declare function actionState(intent: any, name: any): any;
