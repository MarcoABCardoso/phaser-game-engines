import Entity from './Entity.js';
export default class Spawner extends Entity {
    zoneTrigger: Readonly<{
        update(point: any): {
            inside: boolean;
            entered: boolean;
            exited: boolean;
            triggered: boolean;
        };
        reset(nextArmed?: boolean): void;
        readonly armed: boolean;
    }> | null | undefined;
    everyAccum: number | undefined;
    emitted: number | undefined;
    done: boolean | undefined;
    rng: any;
    spawn(scene: any): void;
    update(scene: any, time: any, delta: any): void;
    triggerMet(scene: any, delta: any): boolean;
    emit(scene: any): void;
}
