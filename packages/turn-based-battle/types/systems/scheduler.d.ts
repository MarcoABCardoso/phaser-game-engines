/**
 * Default deterministic round scheduler. It has no participant schema: rules
 * provide IDs, while transactions may add, remove, or prioritize IDs.
 */
export declare function createRoundScheduler(): Readonly<{
    createSchedule(state: any, context: any): any[];
    next(schedule: any): any;
}>;
export declare function applyScheduleChange(schedule: any, change?: {}): any[];
