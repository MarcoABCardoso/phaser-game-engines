export declare const BATTLE_SNAPSHOT_VERSION = 1;
export declare const DEFAULT_PHASE_PIPELINE: readonly (Readonly<{
    id: "turn-start";
    event: "turnStarted";
    hook: "onTurnStart";
}> | Readonly<{
    id: "command-selection";
    event: "commandRequested";
    pause: "command";
}> | Readonly<{
    id: "resolution";
    phase: "resolving";
    run: "resolve";
}> | Readonly<{
    id: "turn-end";
    event: "turnEnded";
    hook: "onTurnEnd";
}>)[];
export default class BattleController {
    spec: any;
    rules: any;
    emit: () => void;
    rng: any;
    clock: {
        now: () => number;
    };
    pipeline: any[];
    scheduler: Readonly<{
        createSchedule(state: any, context: any): any[];
        next(schedule: any): any;
    }>;
    recorder: any;
    snapshotMigrations: {};
    state: any;
    pendingCommand: any;
    interrupts: any[];
    reactions: any[];
    continuation: any;
    constructor(spec: any, { rules, emit, rng, clock, pipeline, scheduler, recorder, snapshot, snapshotMigrations, }?: {
        clock?: {
            now: () => number;
        } | undefined;
        emit?: (() => void) | undefined;
        pipeline?: readonly (Readonly<{
            id: "turn-start";
            event: "turnStarted";
            hook: "onTurnStart";
        }> | Readonly<{
            id: "command-selection";
            event: "commandRequested";
            pause: "command";
        }> | Readonly<{
            id: "resolution";
            phase: "resolving";
            run: "resolve";
        }> | Readonly<{
            id: "turn-end";
            event: "turnEnded";
            hook: "onTurnEnd";
        }>)[] | undefined;
        recorder?: null | undefined;
        rng?: (() => number) | undefined;
        scheduler?: Readonly<{
            createSchedule(state: any, context: any): any[];
            next(schedule: any): any;
        }> | undefined;
        snapshot?: null | undefined;
        snapshotMigrations?: {} | undefined;
    });
    start(): any;
    advance(): any;
    beginScheduledTurn(): void;
    runPipeline(): any;
    phaseDetail(entry: any): {
        commands: any;
        phase?: undefined;
        command?: undefined;
    } | {
        commands?: undefined;
        phase: any;
        command: any;
    };
    availableCommands(): any;
    requestCommand(): void;
    publishSelectionRequested(stages?: any): void;
    commandStages(): any;
    submitSelection(value: any): any;
    submitCommand(command: any): any;
    validateCommand(command: any): boolean;
    resolvePendingCommand(): void;
    queueReaction(command: any, { interrupt }?: {
        interrupt?: boolean | undefined;
    }): void;
    completeEffect(): any;
    resume(): any;
    scheduleParticipant(id: any, { next }?: {
        next?: boolean | undefined;
    }): void;
    unscheduleParticipant(id: any): boolean;
    applyHook(name: any, detail?: {}): void;
    applyTransaction(transaction: any, detail?: {}): void;
    finishIfNeeded(): boolean;
    cancel(reason?: null): boolean;
    snapshot(): {
        version: number;
        data: any;
    };
    restore(snapshot: any, { publish }?: {
        publish?: boolean | undefined;
    }): any;
    debugState(): any;
    transition(phase: any): void;
    context(): {
        machine: any;
        rng: any;
        clock: {
            now: () => number;
        };
        spec: any;
        rules: any;
        queueReaction: (command: any, options: any) => void;
        scheduleParticipant: (id: any, options: any) => void;
        unscheduleParticipant: (id: any) => boolean;
    };
    publish(type: any, detail?: {}): void;
    assertCommandPhase(): void;
    assertRunning(): void;
    isTerminal(): boolean;
}
