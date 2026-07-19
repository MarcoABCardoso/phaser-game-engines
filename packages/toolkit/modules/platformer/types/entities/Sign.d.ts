import Entity from './Entity.js';
export default class Sign extends Entity {
    post: any;
    board: any;
    glyph: any;
    static validateSpec(spec: any, { path, validateRect }: {
        path: any;
        validateRect: any;
    }): void;
    constructor(spec: any);
    spawn(scene: any): void;
    update(scene: any): void;
    destroy(): void;
}
