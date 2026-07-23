import Phaser from 'phaser';
export type SceneControls = {
    read(context?: {
        scene: PlatformerScene;
        time?: number;
        delta?: number;
    }): import('@phaser-game-engines/toolkit/core').InputIntentSource;
    reset?(): unknown;
};
/** @typedef {{ read(context?: { scene: PlatformerScene, time?: number, delta?: number }): import('@phaser-game-engines/toolkit/core').InputIntentSource, reset?(): unknown }} SceneControls */
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
    controls: SceneControls | null;
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
    presentation: Readonly<{
        createPrefab(name: string, props?: Record<string, any>, fallback?: import("../../../core/types/presentation.js").PresentationFactory): import("../../../core/types/presentation.js").PresentationHandle;
        present(name: string, props?: Record<string, any>, fallback?: import("../../../core/types/presentation.js").PresentationFactory): import("../../../core/types/presentation.js").PresentationHandle;
        hasPrefab(name: string): boolean;
        hasPresenter(name: string): boolean;
        clear(): void;
        readonly size: number;
    }>;
    level: void | undefined;
    worldRuntime: Readonly<{
        registry: {};
        entities: import("@phaser-game-engines/toolkit/core").EntityStore;
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
    entities: import("@phaser-game-engines/toolkit/core").EntityStore | undefined;
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
    playerPresentation: Readonly<{
        root: any;
        body: any;
        update(model: any): boolean;
        destroy(): boolean;
        readonly active: boolean;
    }> | undefined;
    platformRects: {} | undefined;
    _onOneWayContact: boolean | undefined;
    player: any;
    onOneWay: boolean | undefined;
    stunUntil: number | undefined;
    prevPlayerX: any;
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
    inputIntent: import("../../../core/types/input.js").InputIntent | undefined;
    nearReadable: {
        id: any;
        prompt: any;
        action: any;
    } | undefined;
    /** @param {{ controls?: SceneControls, [key: string]: any }} config */
    constructor(config?: {
        controls?: SceneControls;
        [key: string]: any;
    });
    create(): void;
    pgeInit(): void;
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
    pgeOnReady(): void;
    pgeOnEntitiesBuilt(): void;
    pgeOnResetTransient(): void;
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
    pgeUpdatePlayerVisual(): void;
    createPlayerObject(x: any, y: any): any;
    /** @param {string} name @param {Record<string, any>} [props] @param {import('@phaser-game-engines/toolkit/core').PresentationFactory} [fallback] */
    createPrefab(name: string, props?: Record<string, any>, fallback?: import('@phaser-game-engines/toolkit/core').PresentationFactory): Readonly<{
        root: any;
        body: any;
        update(model: any): boolean;
        destroy(): boolean;
        readonly active: boolean;
    }>;
    /** @param {string} name @param {Record<string, any>} [props] @param {import('@phaser-game-engines/toolkit/core').PresentationFactory} [fallback] */
    present(name: string, props?: Record<string, any>, fallback?: import('@phaser-game-engines/toolkit/core').PresentationFactory): Readonly<{
        root: any;
        body: any;
        update(model: any): boolean;
        destroy(): boolean;
        readonly active: boolean;
    }>;
    spawnPoint(): any;
    currentDangerTier(): number;
    validateLevelContent(level: any, path?: string): import("../systems/content.js").PlatformerLevel;
    /** Pause simulation while any registered gate returns true. Input still updates. */
    addSimulationGate(gate: any): () => boolean;
    /** Override to supply gamepad, touch, AI, network, or replay input.
     * @returns {import('@phaser-game-engines/toolkit/core').InputIntentSource}
     */
    readInputIntent(time: any, delta: any): import('@phaser-game-engines/toolkit/core').InputIntentSource;
    /** @param {number} _time @param {number} _delta */
    pgeOnTick(_time: number, _delta: number): void;
    pgeOnJump(): void;
    pgeOnAirJump(): void;
    pgeOnWallJump(): void;
    pgeOnDash(): void;
    pgeOnLedgeGrab(): void;
    pgeOnMantle(): void;
    pgeOnLanding(): void;
    pgeOnSprint(): void;
    pgeOnAreaEnter(): void;
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
        x: any;
        y: any;
        top: any;
        bottom: any;
        left: any;
        right: any;
        halfWidth: any;
        halfHeight: any;
        velocityX: any;
        velocityY: any;
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
