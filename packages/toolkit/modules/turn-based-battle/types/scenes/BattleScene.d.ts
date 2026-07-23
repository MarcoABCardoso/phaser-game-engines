import Phaser from 'phaser';
import BattleController from '../systems/BattleController.js';
/** Optional Phaser lifecycle adapter around the headless battle controller. */
export default class BattleScene extends Phaser.Scene {
    recipeComposition: Readonly<{
        ids: readonly any[];
        mechanics: readonly (Function | {
            install: Function;
        })[];
        entityTypes: Readonly<{}>;
        ownership: any;
    }>;
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
    battle: BattleController | undefined;
    constructor(config?: {});
    getBattle(): void;
    getBattleRules(): void;
    pgeCreateBattleDisplay(): void;
    pgeOnBattleEvent(): void;
    pgeRenderBattleState(): void;
    create(): void;
    update(time: any, delta: any): void;
    submitBattleCommand(command: any): void;
    completeBattleEffect(): any;
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
    handleBattleEvent(type: any, payload: any): void;
    refresh(): void;
}
