import { actionState } from '@phaser-game-engines/toolkit/core';
import { advanceDialog, createDialog, isTyping, tickDialog, visibleText } from '../systems/dialog.js';

/** Install pausing, typewriter dialogue without prescribing where conversations are stored. */
export function createDialogueMechanic(options = {}) {
  return function installDialogue(scene) {
    const controller = {
      state: null,
      onDone: null,
      get active() { return Boolean(this.state); },
      start(id, done = null) {
        const conversation = options.getConversation?.(id, scene) ?? options.conversations?.[id];
        if (!conversation || this.active) return false;
        this.state = createDialog(conversation.turns ?? conversation);
        this.onDone = done;
        scene.player?.body?.setVelocity?.(0, 0);
        scene.player?.body?.setAcceleration?.(0, 0);
        options.onStart?.(id, scene, this);
        return true;
      },
      advance() {
        if (!this.state) return false;
        advanceDialog(this.state);
        if (this.state.done) this.end();
        return true;
      },
      end() {
        if (!this.state) return false;
        const done = this.onDone;
        this.state = null;
        this.onDone = null;
        done?.();
        options.onEnd?.(scene, this);
        return true;
      },
      view() {
        if (!this.state) return null;
        const turn = this.state.turns[this.state.index];
        const speaker = options.getSpeaker?.(turn.speaker, scene)
          ?? options.speakers?.[turn.speaker]
          ?? {};
        return {
          speaker,
          side: turn.side ?? 'left',
          text: visibleText(this.state),
          typing: isTyping(this.state),
          index: this.state.index,
          count: this.state.turns.length,
        };
      },
    };
    scene.platformerDialogue = controller;
    const removeGate = scene.addSimulationGate(() => controller.active);
    const stopInput = scene.lifecycle.on('input', ({ delta, intent }) => {
      if (!controller.state) return;
      tickDialog(controller.state, delta);
      if (actionState(intent, options.action ?? 'interact').pressed) controller.advance();
    });
    return () => {
      stopInput();
      removeGate();
      if (scene.platformerDialogue === controller) delete scene.platformerDialogue;
      options.onRemove?.(controller, scene);
    };
  };
}
