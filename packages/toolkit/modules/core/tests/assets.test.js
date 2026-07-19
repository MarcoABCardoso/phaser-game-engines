import { describe, expect, it, vi } from 'vitest';
import {
  createAssetLoadError,
  installAnimationDefinitions,
  preloadAssetManifest,
  validateAssetManifest,
} from '../src/assets.js';

const manifest = {
  assets: [
    { key: 'hero', type: 'image', url: 'hero.png' },
    { key: 'world', type: 'atlas', textureUrl: 'world.png', atlasUrl: 'world.json' },
    { key: 'theme', type: 'audio', urls: ['theme.ogg', 'theme.mp3'] },
  ],
  animations: [{ key: 'walk', frames: { asset: 'world', prefix: 'walk-', start: 0, end: 3 }, frameRate: 8 }],
};

describe('asset manifests', () => {
  it('rejects duplicate keys at their exact manifest path', () => {
    expect(() => validateAssetManifest({ assets: [manifest.assets[0], manifest.assets[0]] }))
      .toThrow('manifest.assets[1].key');
  });
  it('queues supported assets and reports consumer-facing load errors', () => {
    const listeners = new Map();
    const loader = { image: vi.fn(), atlas: vi.fn(), audio: vi.fn(), on: (name, fn) => listeners.set(name, fn), off: vi.fn() };
    const errors = [];
    const stop = preloadAssetManifest(loader, manifest, { onLoadError: (error) => errors.push(error) });
    expect(loader.image).toHaveBeenCalledWith('hero', 'hero.png');
    expect(loader.atlas).toHaveBeenCalledWith('world', 'world.png', 'world.json');
    listeners.get('loaderror')({ key: 'hero', src: 'hero.png' });
    expect(errors[0].message).toContain('"hero"');
    stop();
    expect(loader.off).toHaveBeenCalledWith('loaderror', expect.any(Function));
  });
  it('installs explicit or generated animation frames', () => {
    const manager = { generateFrameNames: vi.fn(() => [{ key: 'world', frame: 'walk-0' }]), create: vi.fn((value) => value) };
    const [animation] = installAnimationDefinitions(manager, manifest.animations);
    expect(animation.frames).toEqual([{ key: 'world', frame: 'walk-0' }]);
  });
  it('formats standalone missing-asset diagnostics', () => {
    expect(createAssetLoadError({ key: 'music', url: 'missing.ogg' }).message).toBe('Asset "music" failed to load from missing.ogg.');
  });
});
