import Entity from './Entity.js';
export default class Gate extends Entity {
    rect: any;
    checkpoint: any;
    static validateSpec(spec: any, { path, validateRect }: {
        path: any;
        validateRect: any;
    }): void;
    spawn(scene: any): void;
    isOpen(scene: any): any;
    update(scene: any): void;
    open(scene: any): void;
    destroy(scene: any): void;
}
