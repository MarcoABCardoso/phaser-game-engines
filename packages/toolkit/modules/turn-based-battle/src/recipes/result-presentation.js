import { defineRecipe } from '@phaser-game-engines/toolkit/core';

/** @typedef {{ id?: string, presenter?: string, getModel?: (outcome: any, scene: any, payload: any) => any, render?: Function, onPresented?: Function }} BattleResultPresentationOptions */

/** Present an opaque terminal battle outcome through a game-owned presenter. */
/** @param {BattleResultPresentationOptions} options */
export function createBattleResultPresentationRecipe(options = {}) {
  const presenter = options.presenter ?? 'battle.result';
  return defineRecipe({
    id: options.id ?? 'battle.result-presentation',
    owns: ['battle.result-presentation'],
    policies: {
      resultPresentation: (scene) => installResultPresentation(scene, {
        ...options,
        presenter,
      }),
    },
  });
}

function installResultPresentation(scene, options) {
  let view = null;
  const stop = scene.lifecycle.on('battleEvent', ({ type, payload }) => {
    if (type !== 'battleEnded') return;
    view?.destroy();
    const outcome = payload.outcome;
    const model = options.getModel?.(outcome, scene, payload) ?? outcome;
    view = scene.present(options.presenter, { outcome, model, payload }, options.render);
    options.onPresented?.(view, { outcome, model, scene, payload });
  });
  scene.battleResultPresentation = { get view() { return view; } };
  return () => {
    stop();
    view?.destroy();
    view = null;
    delete scene.battleResultPresentation;
  };
}
