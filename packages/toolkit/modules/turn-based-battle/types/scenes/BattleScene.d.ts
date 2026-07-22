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
    handleBattleEvent(type: any, payload: any): void;
    refresh(): void;
}
