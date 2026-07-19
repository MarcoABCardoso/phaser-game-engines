export declare const ASSET_MANIFEST_VERSION = 1;
export declare const assetTypes: readonly string[];
export type AssetType = 'image' | 'atlas' | 'tilemap' | 'audio' | 'font';
export type AssetSpec = {
    key: string;
    type: AssetType;
    url?: string;
    urls?: string[];
    textureUrl?: string;
    atlasUrl?: string;
    [key: string]: unknown;
};
export type AnimationDefinition = {
    key: string;
    frames: Array<{
        key: string;
        frame?: string | number;
    }> | {
        asset: string;
        [key: string]: unknown;
    };
    frameRate?: number;
    repeat?: number;
    [key: string]: unknown;
};
export type AssetManifest = {
    schemaVersion?: 1;
    assets: AssetSpec[];
    animations?: AnimationDefinition[];
};
/** @typedef {'image' | 'atlas' | 'tilemap' | 'audio' | 'font'} AssetType */
/** @typedef {{ key: string, type: AssetType, url?: string, urls?: string[], textureUrl?: string, atlasUrl?: string, [key: string]: unknown }} AssetSpec */
/** @typedef {{ key: string, frames: Array<{ key: string, frame?: string | number }> | { asset: string, [key: string]: unknown }, frameRate?: number, repeat?: number, [key: string]: unknown }} AnimationDefinition */
/** @typedef {{ schemaVersion?: 1, assets: AssetSpec[], animations?: AnimationDefinition[] }} AssetManifest */
/** Validate an asset and animation manifest without loading any resources.
 * @param {AssetManifest} manifest @returns {AssetManifest}
 */
export declare function validateAssetManifest(manifest: AssetManifest, { path }?: {
    path?: string | undefined;
}): AssetManifest;
/** Queue a validated manifest through a Phaser-compatible loader adapter.
 * @param {any} loader @param {AssetManifest} manifest
 * @param {{ handlers?: Record<string, Function>, onLoadError?: (error: Error) => void }} options
 */
export declare function preloadAssetManifest(loader: any, manifest: AssetManifest, { handlers, onLoadError }?: {
    handlers?: Record<string, Function>;
    onLoadError?: (error: Error) => void;
}): () => any;
/** Install data-driven animation definitions into a Phaser-compatible manager.
 * @param {any} manager @param {AnimationDefinition[]} definitions
 */
export declare function installAnimationDefinitions(manager: any, definitions?: AnimationDefinition[]): any[];
export declare function createAssetLoadError(file: any): Error;
