/** Headless guard/state for asynchronous area transitions. */
export declare function createAreaTransitionController(): Readonly<{
    begin(areaId: any, entryId: any): {
        areaId: any;
        entryId: any;
    } | null;
    complete(): any;
    cancel(): void;
    readonly active: boolean;
    readonly request: any;
}>;
