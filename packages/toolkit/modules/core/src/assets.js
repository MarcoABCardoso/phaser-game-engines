import { ContentValidationError } from './schema.js';

export const ASSET_MANIFEST_VERSION = 1;
export const assetTypes = Object.freeze(['image', 'atlas', 'tilemap', 'audio', 'font']);

/** @typedef {'image' | 'atlas' | 'tilemap' | 'audio' | 'font'} AssetType */
/** @typedef {{ key: string, type: AssetType, url?: string, urls?: string[], textureUrl?: string, atlasUrl?: string, [key: string]: unknown }} AssetSpec */
/** @typedef {{ key: string, frames: Array<{ key: string, frame?: string | number }> | { asset: string, [key: string]: unknown }, frameRate?: number, repeat?: number, [key: string]: unknown }} AnimationDefinition */
/** @typedef {{ schemaVersion?: 1, assets: AssetSpec[], animations?: AnimationDefinition[] }} AssetManifest */

/** Validate an asset and animation manifest without loading any resources.
 * @param {AssetManifest} manifest @returns {AssetManifest}
 */
export function validateAssetManifest(manifest, { path = 'manifest' } = {}) {
  object(manifest, path);
  if ((manifest.schemaVersion ?? 1) !== ASSET_MANIFEST_VERSION) fail(`${path}.schemaVersion`, `unsupported schema version ${manifest.schemaVersion}.`);
  if (!Array.isArray(manifest.assets)) fail(`${path}.assets`, 'expected an array.');
  const keys = new Set();
  manifest.assets.forEach((asset, index) => {
    const itemPath = `${path}.assets[${index}]`;
    object(asset, itemPath);
    string(asset.key, `${itemPath}.key`);
    if (keys.has(asset.key)) fail(`${itemPath}.key`, `duplicate asset key ${JSON.stringify(asset.key)}.`);
    keys.add(asset.key);
    if (!assetTypes.includes(asset.type)) fail(`${itemPath}.type`, `expected one of ${assetTypes.join(', ')}.`);
    if (asset.type === 'atlas') {
      string(asset.textureUrl, `${itemPath}.textureUrl`);
      string(asset.atlasUrl, `${itemPath}.atlasUrl`);
    } else if (asset.type === 'audio') {
      const urls = Array.isArray(asset.urls) ? asset.urls : [asset.url].filter(Boolean);
      if (!urls.length) fail(`${itemPath}.urls`, 'expected at least one audio URL.');
      urls.forEach((url, urlIndex) => string(url, `${itemPath}.urls[${urlIndex}]`));
    } else string(asset.url, `${itemPath}.url`);
  });
  if (manifest.animations !== undefined && !Array.isArray(manifest.animations)) fail(`${path}.animations`, 'expected an array.');
  const animations = new Set();
  (manifest.animations ?? []).forEach((animation, index) => {
    const itemPath = `${path}.animations[${index}]`;
    object(animation, itemPath);
    string(animation.key, `${itemPath}.key`);
    if (animations.has(animation.key)) fail(`${itemPath}.key`, `duplicate animation key ${JSON.stringify(animation.key)}.`);
    animations.add(animation.key);
    if (!Array.isArray(animation.frames) && !animation.frames?.asset) fail(`${itemPath}.frames`, 'expected explicit frames or an asset frame range.');
  });
  return manifest;
}

/** Queue a validated manifest through a Phaser-compatible loader adapter.
 * @param {any} loader @param {AssetManifest} manifest
 * @param {{ handlers?: Record<string, Function>, onLoadError?: (error: Error) => void }} options
 */
export function preloadAssetManifest(loader, manifest, { handlers = {}, onLoadError } = {}) {
  validateAssetManifest(manifest);
  if (!loader) throw new TypeError('An asset loader is required.');
  const methods = {
    image: typeof loader.image === 'function' ? (asset) => loader.image(asset.key, asset.url) : null,
    atlas: typeof loader.atlas === 'function' ? (asset) => loader.atlas(asset.key, asset.textureUrl, asset.atlasUrl) : null,
    tilemap: typeof loader.tilemapTiledJSON === 'function' ? (asset) => loader.tilemapTiledJSON(asset.key, asset.url) : null,
    audio: typeof loader.audio === 'function' ? (asset) => loader.audio(asset.key, asset.urls ?? asset.url) : null,
    font: null,
  };
  for (const asset of manifest.assets) {
    const method = handlers[asset.type] ?? methods[asset.type];
    if (typeof method !== 'function') throw new ContentValidationError(`manifest.assets.${asset.key}`, `loader does not support asset type ${asset.type}.`);
    method(asset, loader);
  }
  const listener = (file) => onLoadError?.(createAssetLoadError(file));
  loader.on?.('loaderror', listener);
  return () => loader.off?.('loaderror', listener);
}

/** Install data-driven animation definitions into a Phaser-compatible manager.
 * @param {any} manager @param {AnimationDefinition[]} definitions
 */
export function installAnimationDefinitions(manager, definitions = []) {
  if (!manager || typeof manager.create !== 'function') throw new TypeError('An animation manager with create() is required.');
  return definitions.map((definition, index) => {
    let frames = definition.frames;
    if (!Array.isArray(frames)) {
      if (typeof manager.generateFrameNames !== 'function') {
        throw new ContentValidationError(`animations[${index}].frames`, 'manager does not support frame ranges.');
      }
      const { asset, ...range } = frames;
      frames = manager.generateFrameNames(asset, range);
    }
    return manager.create({ ...definition, frames });
  });
}

export function createAssetLoadError(file) {
  const key = file?.key ?? 'unknown';
  const url = file?.src ?? file?.url ?? 'unknown URL';
  return new Error(`Asset ${JSON.stringify(key)} failed to load from ${url}.`);
}

function object(value, path) { if (!value || typeof value !== 'object' || Array.isArray(value)) fail(path, 'expected an object.'); }
function string(value, path) { if (typeof value !== 'string' || !value) fail(path, 'expected a non-empty string.'); }
function fail(path, message) { throw new ContentValidationError(path, message); }
