/** Headless horizontal locomotion. Returns an Arcade-agnostic motion patch. */
export declare function createLocomotionController(): {
    reset(): void;
    update({ inputX, onGround, stunned, inputLocked, dashing, dashDir, velocityX, config }: {
        config: any;
        dashDir: any;
        dashing: any;
        inputLocked: any;
        inputX: any;
        onGround: any;
        stunned: any;
        velocityX: any;
    }): {
        motion: {
            maxVelocityX: any;
            velocityX: number;
            accelerationX: number;
            dragX: any;
        };
        facingDir: number;
        sprinting: any;
    };
    snapshot(): {
        facingDir: number;
    };
};
/** Headless double-tap dash state and air-dash budget. */
export declare function createDashController(): {
    reset(): void;
    update({ time, onGround, stunned, intent, config }: {
        config: any;
        intent: any;
        onGround: any;
        stunned: any;
        time: any;
    }): {
        active: boolean;
        direction: number;
        started: {
            dir: any;
            invincibleMs: any;
        } | null;
    };
    cancel(time: any): void;
    snapshot(): {
        dashUntil: number;
        dashCooldownUntil: number;
        dashDir: number;
        airDashesUsed: number;
    };
};
/** Headless jump buffering, coyote time, air-jump budget, and jump cutting. */
export declare function createJumpController(): {
    reset(): void;
    update({ time, intent, onGround, onOneWay, wallDir, wallEnabled, velocityY, stunned, config }: {
        config: any;
        intent: any;
        onGround: any;
        onOneWay: any;
        stunned: any;
        time: any;
        velocityY: any;
        wallDir: any;
        wallEnabled: any;
    }): {
        kind: string;
        motion: {
            velocityY: any;
        };
        dropThroughUntil: any;
        down: any;
        queued: any;
    };
    consumeBuffer(): void;
    snapshot(): {
        airJumpsUsed: number;
        coyoteUntil: number;
        jumpBufferedUntil: number;
        jumpHeldLastFrame: boolean;
    };
};
/** Headless wall-slide decision and post-wall-jump input lock. */
export declare function createWallTraversalController(): {
    reset(): void;
    update({ time, onGround, wallDir, inputX, velocityY, config }: {
        config: any;
        inputX: any;
        onGround: any;
        time: any;
        velocityY: any;
        wallDir: any;
    }): {
        sliding: boolean;
        inputLocked: boolean;
        velocityY: any;
    };
    startJump(time: any, wallDir: any, config: any): {
        velocityX: number;
    };
    snapshot(): {
        wallJumpLockUntil: number;
        wallSliding: boolean;
    };
};
/** Headless ledge selection and hang/mantle state. */
export declare function createLedgeTraversalController(): {
    reset(): void;
    update({ time, inputX, down, jumpQueued, onGround, dashing, body, solids, config }: {
        body: any;
        config: any;
        dashing: any;
        down: any;
        inputX: any;
        jumpQueued: any;
        onGround: any;
        solids: any;
        time: any;
    }): {
        motion: {
            allowGravity: boolean;
            velocityX: number;
            velocityY: number;
            accelerationX: number;
            gravityY: number;
        };
        event: {
            type: string;
            ledge: any;
        };
        hanging: null;
    } | {
        motion: {
            allowGravity: boolean;
            velocityX: number;
            velocityY: number;
            accelerationX: number;
            gravityY: number;
        };
        event: null;
        hanging: any;
    } | {
        motion: {
            allowGravity?: undefined;
            velocityX?: undefined;
            velocityY?: undefined;
            accelerationX?: undefined;
            gravityY?: undefined;
        };
        event: null;
        hanging: any;
    } | {
        motion: {
            allowGravity: boolean;
            velocityX: number;
            velocityY: number;
            accelerationX: number;
            gravityY: number;
        };
        event: {
            type: string;
            ledge: {
                top: any;
                faceX: any;
                dir: any;
            };
        };
        hanging: {
            top: any;
            faceX: any;
            dir: any;
        };
    };
    release(time: any, cooldownMs?: 300): void;
    snapshot(): {
        hanging: any;
        ledgeCooldownUntil: number;
    };
};
/** Reports landings without assigning damage, health, or failure semantics. */
export declare function createLandingController(): {
    reset(y?: number): void;
    freezeAt(y: any): void;
    update({ y, onGround, velocityY }: {
        onGround: any;
        velocityY: any;
        y: any;
    }): {
        drop: number;
        impactVelocity: number;
    } | null;
    snapshot(): {
        groundY: number;
        takeoffY: number;
        wasAirborne: boolean;
    };
};
/**
 * Compose the traversal abilities into one deterministic step. Each individual
 * controller can also be used alone by games with a different physics adapter.
 */
export declare function createTraversalController(overrides?: {}): Readonly<{
    reset: (y?: number) => any;
    step: ({ time, delta, intent, body, onOneWay: oneWayContact, solids, config }: {
        body: any;
        config: any;
        delta: any;
        intent: any;
        onOneWay?: boolean | undefined;
        solids?: never[] | undefined;
        time: any;
    }) => {
        motion: {
            velocityY: any;
            gravityY: any;
        };
        events: any[];
        state: any;
    };
    snapshot: () => any;
    locomotion: any;
    dash: any;
    jump: any;
    wall: any;
    ledge: any;
    landing: any;
}>;
