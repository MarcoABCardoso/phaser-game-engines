/**
 * Create a small, serializable PRNG. The returned function is compatible with
 * APIs that expect `Math.random`, and also exposes `next/getState/setState`.
 */
export declare function createSeededRng(seed?: number): {
    (): number;
    next: /*elided*/ any;
    getState: () => {
        algorithm: string;
        seed: number;
        state: number;
    };
    setState: (snapshot: any) => void;
};
/** A deterministic clock whose time advances only when the caller asks it to. */
export declare function createManualClock(initialTime?: number): Readonly<{
    now: () => number;
    advance(delta?: number): number;
    set(value: any): number;
    getState: () => {
        time: number;
    };
    setState(snapshot: any): void;
}>;
export declare function systemClock(): Readonly<{
    now: () => number;
}>;
