import Phaser from 'phaser';
export type SceneControls = {
    read(context?: {
        scene: TopDownScene;
        time?: number;
        delta?: number;
    }): import('@phaser-game-engines/toolkit/core').InputIntentSource;
    reset?(): unknown;
};
/** @typedef {{ read(context?: { scene: TopDownScene, time?: number, delta?: number }): import('@phaser-game-engines/toolkit/core').InputIntentSource, reset?(): unknown }} SceneControls */
/** Extend this scene and return a level with world, spawn, walls, and entitySpecs. */
export default class TopDownScene extends Phaser.Scene {
    recipeComposition: Readonly<{
        ids: readonly any[];
        mechanics: readonly (Function | {
            install: Function;
        })[];
        entityTypes: Readonly<{}>;
        ownership: any;
    }>;
    entityTypes: any;
    controls: SceneControls | null;
    configuredMechanics: any[];
    worldRuntimeOptions: any;
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
    transitioning: boolean | undefined;
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
    solids: Phaser.Physics.Arcade.StaticGroup | undefined;
    player: Phaser.GameObjects.Rectangle | undefined;
    keys: object | undefined;
    cursors: Phaser.Types.Input.Keyboard.CursorKeys | undefined;
    contextualActions: any[] | undefined;
    contextualActionActivation: {
        key: any;
        heldMs: number;
        fired: boolean;
    } | {
        key: any;
        heldMs: any;
        fired: any;
    } | null | undefined;
    entities: import("@phaser-game-engines/toolkit/core").EntityStore | undefined;
    prompt: Phaser.GameObjects.Text | undefined;
    inputIntent: import("../../../core/types/input.js").InputIntent | undefined;
    facing: any;
    currentContextualAction: any;
    message: any;
    messageUntil: number | undefined;
    /** @param {{ controls?: SceneControls, [key: string]: any }} config */
    constructor(config?: {
        controls?: SceneControls;
        [key: string]: any;
    });
    getLevel(): void;
    moveSpeed(): number;
    statusText(): string;
    getMechanics(): any[];
    onEntitiesBuilt(): void;
    onReady(): void;
    /** @param {number} _time @param {number} _delta */
    onTick(_time: number, _delta: number): void;
    create(): void;
    addSolid(rect: any, color?: number): Phaser.GameObjects.Rectangle;
    /**
     * Phaser keyboard adapter for the engine's device-independent input contract.
     * Games may override this to provide gamepad, touch, AI, network, or replay input.
     * @returns {import('@phaser-game-engines/toolkit/core').InputIntentSource}
     */
    readInputIntent(time: any, delta: any): import('@phaser-game-engines/toolkit/core').InputIntentSource;
    update(time: any, delta: any): void;
    offerContextualAction(action: any): any;
    /** @returns {{ scene: TopDownScene, player: any, intent: any, time: number, delta: number }} */
    contextualActionContext(time?: number, delta?: number): {
        scene: TopDownScene;
        player: any;
        intent: any;
        time: number;
        delta: number;
    };
    wasInteractJustPressed(): any;
    interact(entity: any): void;
    showMessage(message: any, duration?: number): void;
    panCameraTo(x: any, y: any, duration?: number): void;
    enterArea(to: any, entry: any): void;
    onInteract(): void;
    onEnterArea(): void;
}
