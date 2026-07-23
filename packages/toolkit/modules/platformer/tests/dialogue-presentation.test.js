import { describe, expect, it, vi } from 'vitest';
import { createLifecycle } from '@phaser-game-engines/toolkit/core';
import { createDialoguePresentationRecipe } from '../src/recipes/dialogue-presentation.js';

describe('dialogue presentation recipe', () => {
  it('mounts, updates, and removes the dialogue presenter from the view model', () => {
    const lifecycle = createLifecycle();
    const update = vi.fn();
    const destroy = vi.fn();
    const present = vi.fn(() => ({ update, destroy }));
    let model = null;
    const dialogue = { view: () => model };
    const scene = { lifecycle, present, platformerDialogue: dialogue };
    const recipe = createDialoguePresentationRecipe();
    const cleanup = recipe.policies.dialoguePresentation(scene);

    model = { text: 'H' };
    lifecycle.emit('tick');
    expect(present).toHaveBeenCalledWith('dialog', { model, dialogue }, undefined);

    model = { text: 'Hi' };
    lifecycle.emit('tick');
    expect(update).toHaveBeenCalledWith(model);

    model = null;
    lifecycle.emit('tick');
    expect(destroy).toHaveBeenCalledOnce();
    cleanup();
  });
});
