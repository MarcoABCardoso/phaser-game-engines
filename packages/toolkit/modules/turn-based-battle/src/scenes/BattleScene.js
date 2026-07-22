import Phaser from 'phaser';
import {
  composeRecipes,
  createLifecycle,
  createMechanicHost,
  lifecycleEvent,
  runCleanups,
} from '@phaser-game-engines/toolkit/core';
import BattleController from '../systems/BattleController.js';

/** Optional Phaser lifecycle adapter around the headless battle controller. */
export default class BattleScene extends Phaser.Scene {
  constructor(config = {}) {
    super(config);
    this.recipeComposition = composeRecipes(config.recipes ?? []);
    this.lifecycle = createLifecycle();
    this.mechanicHost = createMechanicHost(this);
  }

  getBattle() { throw new Error('BattleScene subclasses must implement getBattle()'); }
  getBattleRules() { throw new Error('BattleScene subclasses must implement getBattleRules()'); }
  pgeCreateBattleDisplay() {}
  pgeOnBattleEvent() {}
  pgeRenderBattleState() {}

  create() {
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => runCleanups([
      () => this.lifecycle.emit(lifecycleEvent.shutdown, { scene: this }),
      () => this.mechanicHost.clear(),
    ], 'Battle scene shutdown failed.'));
    this.battle = new BattleController(this.getBattle(), {
      rules: this.getBattleRules(),
      rng: this.battleRng?.bind(this) ?? Math.random,
      emit: this.handleBattleEvent.bind(this),
    });
    for (const mechanic of this.recipeComposition.mechanics) this.mechanicHost.install(mechanic);
    this.pgeCreateBattleDisplay();
    this.battle.start();
    this.refresh();
    this.lifecycle.emit(lifecycleEvent.ready, { scene: this });
  }

  update(time, delta) {
    this.lifecycle.emit(lifecycleEvent.tick, { scene: this, time, delta });
  }

  submitBattleCommand(command) {
    this.battle.submitCommand(command);
    this.refresh();
  }

  handleBattleEvent(type, payload) {
    this.pgeOnBattleEvent(type, payload);
    this.lifecycle.emit('battleEvent', { scene: this, type, payload });
  }

  refresh() {
    this.pgeRenderBattleState(this.battle.state);
    this.lifecycle.emit('refresh', { scene: this, state: this.battle.state });
  }
}
