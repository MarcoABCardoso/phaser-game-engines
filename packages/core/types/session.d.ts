/** Capture only explicitly registered, JSON-friendly game/session components. */
export declare function captureSessionSnapshot(components: any, { version, metadata }?: {
    metadata?: {} | undefined;
    version?: number | undefined;
}): {
    version: number;
    metadata: any;
    components: {};
};
/** Restore explicit components; Phaser objects are never traversed or serialized. */
export declare function restoreSessionSnapshot(snapshot: any, components: any, { migrations, version }?: {
    migrations?: {} | undefined;
    version?: number | undefined;
}): any;
/** Build a deterministic bug-report envelope. Game state is excluded unless supplied. */
export declare function createBugReportBundle({ engineVersions, contentVersions, seed, recording, checkpoints, gameData }?: {
    contentVersions?: {} | undefined;
    engineVersions?: {} | undefined;
}): {
    version: number;
    engineVersions: any;
    contentVersions: any;
    seed: any;
    recording: any;
    checkpoints: any;
};
