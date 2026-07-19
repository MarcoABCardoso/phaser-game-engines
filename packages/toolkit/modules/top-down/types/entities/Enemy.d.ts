import Entity from './Entity.js';
export default class Enemy extends Entity {
    health: any;
    speed: any;
    sprite: any;
    collider: any;
    static validateSpec(spec: any, { path, finite }: {
        finite: any;
        path: any;
    }): void;
    constructor(spec: any);
    spawn(scene: any): void;
    update(scene: any): void;
    inAttackRange(scene: any): any;
    onHit(scene: any, damage: any): void;
    destroy(scene: any): void;
}
