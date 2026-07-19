import Entity from './Entity.js';
import { validatePortalSpec } from '@phaser-game-engines/toolkit/core';
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
    static validateSpec: typeof validatePortalSpec;
    spawn(): void;
    update(scene: any): void;
}
