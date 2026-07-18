export declare const TYPE_SPEED = 45;
export declare function createDialog(turns: any): {
    turns: any;
    index: number;
    shown: number;
    done: boolean;
};
export declare function currentTurn(state: any): any;
export declare function isTyping(state: any): boolean;
export declare function tickDialog(state: any, deltaMs: any, speed?: number): any;
export declare function visibleText(state: any): any;
export declare function advanceDialog(state: any): any;
