import Entity from './Entity.js';
export default class DialogTrigger extends Entity {
    fired: boolean | undefined;
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
    static validateSpec(spec: any, { path, validateRect }: {
        path: any;
        validateRect: any;
    }): void;
    spawn(): void;
    update(scene: any): void;
}
