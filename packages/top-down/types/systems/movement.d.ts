export declare function resolveMovement({ left, right, up, down, speed }: {
    down?: boolean | undefined;
    left?: boolean | undefined;
    right?: boolean | undefined;
    speed?: number | undefined;
    up?: boolean | undefined;
}): {
    x: number;
    y: number;
};
export declare function facingFromVelocity(x: any, y: any, fallback?: string): string;
/** Convert an already-normalized input intent into world velocity. */
export declare function movementFromIntent(move?: {}, speed?: number): {
    x: number;
    y: number;
};
