/** Pauseable, step-driven replay with first-divergence reporting. */
export declare function createReplayViewer(recording: any, handlers?: {}): Readonly<{
    play: () => void;
    pause: () => void;
    step: (count?: number) => number;
    update: (entryBudget?: number) => number;
    setSpeed(value: any): void;
    readonly state: {
        cursor: number;
        paused: boolean;
        speed: number;
        complete: boolean;
        divergence: any;
    };
}>;
