export type BattleResultPresentationOptions = {
    id?: string;
    presenter?: string;
    getModel?: (outcome: any, scene: any, payload: any) => any;
    render?: Function;
    onPresented?: Function;
};
/** @typedef {{ id?: string, presenter?: string, getModel?: (outcome: any, scene: any, payload: any) => any, render?: Function, onPresented?: Function }} BattleResultPresentationOptions */
/** Present an opaque terminal battle outcome through a game-owned presenter. */
/** @param {BattleResultPresentationOptions} options */
export declare function createBattleResultPresentationRecipe(options?: BattleResultPresentationOptions): any;
