/**
 * Create a DOM-keyboard adapter for the canonical input intent shape.
 * The target is injected so tests, iframes, and games with focused canvases do
 * not need to rely on the global window.
 * @param {{ target?: EventTarget, bindings?: Record<string, any>, labels?: Record<string, string> }} options
 */
export declare function createKeyboardInputAdapter({ target, bindings, labels, }?: {
    target?: EventTarget;
    bindings?: Record<string, any>;
    labels?: Record<string, string>;
}): Readonly<{
    destroy(): boolean;
    read: () => import("./input.js").InputIntent;
    setBindings: (next: any) => any;
    getBindings: () => any;
    getPrompt: (action: any) => string;
    reset: () => void;
}>;
/** Create a polling adapter for the standard browser Gamepad API shape.
 * @param {{ index?: number, getGamepad?: () => Gamepad | null, bindings?: Record<string, any>, labels?: Record<string, string>, deadzone?: number }} options
 */
export declare function createGamepadInputAdapter({ index, getGamepad, bindings, labels, deadzone, }?: {
    index?: number;
    getGamepad?: () => Gamepad | null;
    bindings?: Record<string, any>;
    labels?: Record<string, string>;
    deadzone?: number;
}): Readonly<{
    read: () => import("./input.js").InputIntent;
    setBindings(next: any): any;
    getBindings: () => any;
    getPrompt: (action: any) => string;
    reset(): void;
}>;
/**
 * Create an imperative adapter for virtual sticks, on-screen buttons, or other
 * touch UI. Games connect their own presentation to setMove/setAction.
 * @param {{ actions?: string[], labels?: Record<string, string> }} options
 */
export declare function createTouchInputAdapter({ actions, labels }?: {
    actions?: string[];
    labels?: Record<string, string>;
}): Readonly<{
    read: () => import("./input.js").InputIntent;
    setMove(x: any, y: any): void;
    setAction(name: any, value: any): void;
    getPrompt: (action: any) => string;
    reset(): void;
}>;
