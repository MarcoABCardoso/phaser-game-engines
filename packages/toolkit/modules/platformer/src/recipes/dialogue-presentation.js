import { defineRecipe } from '@phaser-game-engines/toolkit/core';

/** @typedef {{ id?: string, presenter?: string, getModel?: (view: any, scene: any, dialogue: any) => any, render?: Function, onPresented?: Function }} DialoguePresentationOptions */

/** Render the presentation-neutral dialogue view model through a game-owned presenter. */
/** @param {DialoguePresentationOptions} options */
export function createDialoguePresentationRecipe(options = {}) {
  const presenter = options.presenter ?? 'dialog';
  return defineRecipe({
    id: options.id ?? 'platformer.dialogue-presentation',
    owns: ['presentation.dialogue'],
    policies: {
      dialoguePresentation: (scene) => installDialoguePresentation(scene, {
        ...options,
        presenter,
      }),
    },
  });
}

function installDialoguePresentation(scene, options) {
  let view = null;
  const render = () => {
    const dialogue = scene.platformerDialogue;
    const source = dialogue?.view?.() ?? null;
    const model = source && (options.getModel?.(source, scene, dialogue) ?? source);
    if (!model) {
      view?.destroy();
      view = null;
      return;
    }
    if (!view) {
      view = scene.present(options.presenter, { model, dialogue }, options.render);
      options.onPresented?.(view, { model, dialogue, scene });
    } else {
      view.update(model);
    }
  };
  const stopReady = scene.lifecycle.on('ready', render);
  const stopTick = scene.lifecycle.on('tick', render);
  scene.dialoguePresentation = { get view() { return view; }, render };
  return () => {
    stopReady();
    stopTick();
    view?.destroy();
    view = null;
    delete scene.dialoguePresentation;
  };
}
