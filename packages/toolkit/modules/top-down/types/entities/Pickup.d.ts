import Entity from './Entity.js';
export default class Pickup extends Entity {
    sprite: any;
    static validateSpec(spec: any, { path, finite }: {
        finite: any;
        path: any;
    }): void;
    spawn(scene: any): void;
    update(scene: any): void;
    destroy(): void;
}
