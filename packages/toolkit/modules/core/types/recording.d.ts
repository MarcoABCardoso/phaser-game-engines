/** Record normalized intents and battle commands on one explicit timeline. */
export declare function createSessionRecorder({ clock, metadata }?: {
    clock?: {
        now: () => 0;
    } | undefined;
    metadata?: {} | undefined;
}): Readonly<{
    record: (type: any, payload: any) => {
        index: number;
        time: 0;
        type: string;
        payload: any;
    };
    recordIntent: (intent: any) => {
        index: number;
        time: 0;
        type: string;
        payload: any;
    };
    recordBattleCommand: (command: any) => {
        index: number;
        time: 0;
        type: string;
        payload: any;
    };
    recordCheckpoint: (state: any) => {
        index: number;
        time: 0;
        type: string;
        payload: any;
    };
    clear: () => void;
    snapshot: () => {
        version: number;
        metadata: any;
        entries: any;
    };
    readonly entries: any[];
}>;
/** Replay a recording in stable `(time, index)` order without wall-clock waits. */
export declare function replaySession(recording: any, handlers?: {}): number;
