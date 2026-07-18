import Phaser from 'phaser';
export default class PlatformerScene extends Phaser.Scene {
    recipeComposition: Readonly<{
        ids: readonly any[];
        mechanics: readonly (Function | {
            install: Function;
        })[];
        entityTypes: Readonly<{}>;
        ownership: any;
    }>;
    configuredMechanics: any[];
    entityTypes: any;
    worldRuntimeOptions: any;
    simulationGates: Set<any>;
    lifecycle: Readonly<{
        on: (event: any, listener: any) => () => boolean;
        once: (event: any, listener: any) => () => boolean;
        emit: (event: any, payload: any) => number;
        clear: (event: any) => void;
    }>;
    mechanicHost: Readonly<{
        install: (mechanic: any) => any;
        remove: (mechanic: any) => any;
        clear: () => void;
        has: (mechanic: any) => boolean;
        list: () => any[];
    }>;
    level: void | undefined;
    worldRuntime: Readonly<{
        registry: {};
        entities: import("@phaser-game-engines/core").EntityStore;
        clock: any;
        rng: Readonly<{
            next(): any;
        }>;
        snapshots: Readonly<{
            version: number;
            serialize: (source: any) => {
                version: number;
                data: any;
            };
            deserialize: (snapshot: any, target: any) => any;
        }>;
        validateLevel: (level: any, options?: {}) => any;
    }> | undefined;
    currentAreaId: any;
    transitioning: boolean | undefined;
    solids: Phaser.Physics.Arcade.StaticGroup | undefined;
    oneWayPlatforms: Phaser.Physics.Arcade.StaticGroup | undefined;
    movers: Phaser.Physics.Arcade.Group | undefined;
    worldDecor: any[] | undefined;
    entities: import("@phaser-game-engines/core").EntityStore | undefined;
    traversalController: Readonly<{
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
    }> | undefined;
    areaTransitionController: Readonly<{
        begin(areaId: any, entryId: any): {
            areaId: any;
            entryId: any;
        } | null;
        complete(): any;
        cancel(): void;
        readonly active: boolean;
        readonly request: any;
    }> | undefined;
    keys: object | undefined;
    platformRects: {} | undefined;
    _onOneWayContact: boolean | undefined;
    player: Phaser.GameObjects.Rectangle | undefined;
    onOneWay: boolean | undefined;
    stunUntil: number | undefined;
    prevPlayerX: number | undefined;
    contextualActions: any[] | undefined;
    currentContextualAction: any;
    contextualActionActivation: {
        key: any;
        heldMs: number;
        fired: boolean;
    } | {
        key: any;
        heldMs: any;
        fired: any;
    } | null | undefined;
    inputIntent: import("@phaser-game-engines/core/input.js").InputIntent | undefined;
    nearReadable: {
        id: any;
        prompt: any;
        action: any;
    } | undefined;
    constructor(config?: {});
    create(): void;
    init(): void;
    getLevel(): void;
    createTraversalController(): Readonly<{
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
    createAreaTransitionController(): Readonly<{
        begin(areaId: any, entryId: any): {
            areaId: any;
            entryId: any;
        } | null;
        complete(): any;
        cancel(): void;
        readonly active: boolean;
        readonly request: any;
    }>;
    onReady(): void;
    onEntitiesBuilt(): void;
    onResetTransient(): void;
    jumpVelocity(): number;
    moveMaxSpeed(): number;
    moveAccel(): number;
    airJumpCount(): number;
    groundDragX(): number;
    airDragX(): number;
    dashConfig(): null;
    coyoteMs(): number;
    jumpBufferMs(): number;
    fastFallGravity(): number;
    wallSlideConfig(): null;
    ledgeGrabConfig(): null;
    updatePlayerVisual(): void;
    createPlayerObject(x: any, y: any): Phaser.GameObjects.Rectangle;
    spawnPoint(): any;
    currentDangerTier(): number;
    validateLevelContent(level: any, path?: string): import("../systems/content.js").PlatformerLevel;
    /** Pause simulation while any registered gate returns true. Input still updates. */
    addSimulationGate(gate: any): () => boolean;
    /** Override to supply gamepad, touch, AI, network, or replay input.
     * @returns {import('@phaser-game-engines/core').InputIntentSource}
     */
    readInputIntent(): import('@phaser-game-engines/core').InputIntentSource;
    onTick(): void;
    onJump(): void;
    onAirJump(): void;
    onWallJump(): void;
    onDash(): void;
    onLedgeGrab(): void;
    onMantle(): void;
    onLanding(): void;
    onSprint(): void;
    onAreaEnter(): void;
    addSolid(rect: any, color: any): Phaser.GameObjects.Rectangle;
    buildWorld(): void;
    oneWayProcess(player: any, platform: any): boolean;
    onOneWayContact(): void;
    buildPlayer(): void;
    resetTransient(): void;
    teardownWorld(): void;
    swapWorld(areaId: any): void;
    enterArea(areaId: any, entryId: any): void;
    resetAreaTransient(): void;
    resetObstacles(): void;
    update(time: any, delta: any): void;
    get playerMoving(): boolean;
    traversalConfig(): {
        maxSpeed: number;
        accel: number;
        groundDragX: number;
        airDragX: number;
        jumpVelocity: number;
        airJumpCount: number;
        coyoteMs: number;
        jumpBufferMs: number;
        fastFallGravity: number;
        stunUntil: number | undefined;
        dash: null;
        wall: null;
        ledge: null;
    };
    traversalBodyState(onGround: any): {
        x: number;
        y: number;
        top: any;
        bottom: any;
        left: any;
        right: any;
        halfWidth: any;
        halfHeight: any;
        velocityX: number;
        velocityY: number;
        onGround: any;
        blockedLeft: any;
        blockedRight: any;
    };
    updateTraversal(time: any, delta: any, onGround: any, onOneWay: any): void;
    applyTraversalMotion(motion: any): void;
    syncTraversalState(state?: {}): void;
    handleTraversalEvent(event: any, time: any): void;
    releaseHang(time: any): void;
    offerContextualAction(action: any): any;
    /** @returns {{ scene: PlatformerScene, player: any, intent: any, time: number, delta: number }} */
    contextualActionContext(time?: number, delta?: number): {
        scene: PlatformerScene;
        player: any;
        intent: any;
        time: number;
        delta: number;
    };
    resolveContextualActions(time: any, delta: any): void;
    wasInteractJustPressed(): any;
}
