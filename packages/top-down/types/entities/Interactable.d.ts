import Entity from './Entity.js';
export default class Interactable extends Entity {
    sprite: any;
    static validateSpec(spec: any, { path, finite, validateRect }: {
        finite: any;
        path: any;
        validateRect: any;
    }): void;
    constructor(spec: any);
    spawn(scene: any): void;
    update(scene: any): void;
    destroy(): void;
}
