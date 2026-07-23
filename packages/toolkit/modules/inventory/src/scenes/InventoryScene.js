import Phaser from 'phaser';
import {
  composeRecipes,
  createLifecycle,
  createMechanicHost,
  createPresentationHost,
  lifecycleEvent,
  runCleanups,
} from '@phaser-game-engines/toolkit/core';

/** Optional Phaser lifecycle adapter around a persistent headless inventory. */
export default class InventoryScene extends Phaser.Scene {
  constructor(config = {}) {
    super(config);
    this.recipeComposition = composeRecipes(config.recipes ?? []);
    this.lifecycle = createLifecycle();
    this.mechanicHost = createMechanicHost(this);
    this.presentation = createPresentationHost(this, config.presentation);
  }

  getInventory() { throw new Error('InventoryScene subclasses must implement getInventory()'); }
  pgeCreateInventoryDisplay() {}
  pgeRenderInventoryState() {}

  create() {
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => runCleanups([
      () => this.lifecycle.emit(lifecycleEvent.shutdown, { scene: this }),
      () => this.unsubscribeInventory?.(),
      () => this.mechanicHost.clear(),
      () => this.presentation.clear(),
    ], 'Inventory scene shutdown failed.'));
    this.inventory = this.getInventory();
    if (!this.inventory || typeof this.inventory.move !== 'function') {
      throw new TypeError('getInventory() must return an Inventory-compatible object.');
    }
    this.unsubscribeInventory = this.inventory.subscribe?.(() => this.refresh());
    for (const mechanic of this.recipeComposition.mechanics) this.mechanicHost.install(mechanic);
    this.pgeCreateInventoryDisplay();
    this.refresh();
    this.lifecycle.emit(lifecycleEvent.ready, { scene: this });
  }

  update(time, delta) { this.lifecycle.emit(lifecycleEvent.tick, { scene: this, time, delta }); }

  moveInventoryItem(from, to) { return this.inventory.move(from, to); }
  useInventoryItem(location, context) { return this.inventory.use(location, context ?? { scene: this }); }
  /** @param {string} name @param {Record<string, any>} [props] @param {import('@phaser-game-engines/toolkit/core').PresentationFactory} [fallback] */
  createPrefab(name, props = {}, fallback = undefined) { return this.presentation.createPrefab(name, props, fallback); }
  /** @param {string} name @param {Record<string, any>} [props] @param {import('@phaser-game-engines/toolkit/core').PresentationFactory} [fallback] */
  present(name, props = {}, fallback = undefined) { return this.presentation.present(name, props, fallback); }

  refresh() {
    const state = this.inventory.snapshot();
    this.pgeRenderInventoryState(state);
    this.lifecycle.emit('refresh', { scene: this, state });
  }
}
