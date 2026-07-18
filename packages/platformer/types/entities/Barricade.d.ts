import Entity from './Entity.js';
export default class Barricade extends Entity {
    wall: any;
    maxHp: any;
    hp: any;
    broken: boolean | undefined;
    rect: any;
    static validateSpec(spec: any, { path, finite, validateRect }: {
        finite: any;
        path: any;
        validateRect: any;
    }): void;
    constructor(spec: any);
    spawn(scene: any): void;
    inAttackRange(scene: any): boolean;
    onHit(scene: any, damage: any): void;
    destroy(scene: any): void;
}
