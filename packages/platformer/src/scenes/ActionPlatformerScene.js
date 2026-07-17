import PlatformerScene from './PlatformerScene.js';

/** Compatibility recipe that opts into the former all-in-one platformer behavior. */
export default class ActionPlatformerScene extends PlatformerScene {
  constructor(config = {}) {
    super({ ...config, legacyRealTimeMechanics: true });
  }
}
