export type DialoguePresentationOptions = {
    id?: string;
    presenter?: string;
    getModel?: (view: any, scene: any, dialogue: any) => any;
    render?: Function;
    onPresented?: Function;
};
/** @typedef {{ id?: string, presenter?: string, getModel?: (view: any, scene: any, dialogue: any) => any, render?: Function, onPresented?: Function }} DialoguePresentationOptions */
/** Render the presentation-neutral dialogue view model through a game-owned presenter. */
/** @param {DialoguePresentationOptions} options */
export declare function createDialoguePresentationRecipe(options?: DialoguePresentationOptions): any;
