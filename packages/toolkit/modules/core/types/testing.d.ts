/** Minimal deterministic simulation harness for controller and vertical-slice tests. */
export declare function createSimulationHarness({ clock, step, snapshot }?: {}): Readonly<{
    advance(input: any, delta?: number): any;
    run(inputs: any, delta?: number): any;
    snapshot: () => any;
    readonly history: any[];
}>;
/** Measure synchronous work against an explicit budget without choosing an optimizer. */
export declare function measureBudget(name: any, operation: any, { iterations, budgetMs, now }?: {
    budgetMs?: number | undefined;
    iterations?: number | undefined;
    now?: (() => number) | undefined;
}): {
    name: any;
    iterations: number;
    durationMs: number;
    perIterationMs: number;
    budgetMs: number;
    passed: boolean;
};
