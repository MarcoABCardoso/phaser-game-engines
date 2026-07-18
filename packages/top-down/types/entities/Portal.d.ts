import Entity from './Entity.js';
import { validatePortalSpec } from '@phaser-game-engines/core';
export default class Portal extends Entity {
    trigger: Readonly<{
        update(point: any): {
            inside: boolean;
            entered: boolean;
            exited: boolean;
            triggered: boolean;
        };
        reset(nextArmed?: boolean): void;
        readonly armed: boolean;
    }> | undefined;
    marker: any;
    label: any;
    static validateSpec: typeof validatePortalSpec;
    spawn(scene: any): void;
    update(scene: any): void;
    destroy(): void;
}
