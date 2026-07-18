export declare function shouldCollideOneWay({ velocityY, prevBottom, platformTop, grace, dropping, }: {
    dropping?: boolean | undefined;
    grace?: number | undefined;
    platformTop: any;
    prevBottom: any;
    velocityY: any;
}): boolean;
export declare function registerTap(state: any, dir: any, time: any, windowMs: any): {
    state: {
        dir: any;
        at: any;
    };
    dashed: boolean;
};
export declare function resolveJump({ onGround, coyoteOk, dropRequested, onOneWay, touchingWallDir, wallJumpEnabled, airJumpsUsed, airJumpAllowance, }: {
    airJumpAllowance: any;
    airJumpsUsed: any;
    coyoteOk?: boolean | undefined;
    dropRequested: any;
    onGround: any;
    onOneWay: any;
    touchingWallDir?: number | undefined;
    wallJumpEnabled?: boolean | undefined;
}): "air" | "drop" | "ground" | "none" | "wall";
export declare function findGrabbableLedge({ playerTop, playerBottom, playerLeft, playerRight, dir, solids, reach, band, }: {
    band?: number | undefined;
    dir: any;
    playerBottom: any;
    playerLeft: any;
    playerRight: any;
    playerTop: any;
    reach?: number | undefined;
    solids: any;
}): {
    top: any;
    faceX: any;
    dir: any;
} | null;
