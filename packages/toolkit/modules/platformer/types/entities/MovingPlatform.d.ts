import Entity from './Entity.js';
export default class MovingPlatform extends Entity {
    homeX: any;
    homeY: any;
    w: number | undefined;
    theta: number | undefined;
    rect: any;
    static validateSpec(spec: any, { path, validateRect }: {
        path: any;
        validateRect: any;
    }): void;
    spawn(scene: any): void;
    update(scene: any, _time: any, delta: any): void;
    destroy(scene: any): void;
}
