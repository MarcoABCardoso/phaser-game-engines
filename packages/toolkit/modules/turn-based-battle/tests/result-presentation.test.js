import { describe, expect, it, vi } from 'vitest';
import { createLifecycle } from '@phaser-game-engines/toolkit/core';
import { createBattleResultPresentationRecipe } from '../src/recipes/result-presentation.js';

describe('battle result presentation recipe', () => {
  it('presents an opaque outcome and cleans up the view', () => {
    const lifecycle = createLifecycle();
    const destroy = vi.fn();
    const present = vi.fn(() => ({ destroy }));
    const scene = { lifecycle, present };
    const recipe = createBattleResultPresentationRecipe({
      getModel: (outcome) => ({ title: outcome.kind }),
    });
    const cleanup = recipe.policies.resultPresentation(scene);

    lifecycle.emit('battleEvent', {
      type: 'battleEnded',
      payload: { outcome: { kind: 'escaped', gameOwned: true } },
    });

    expect(present).toHaveBeenCalledWith('battle.result', {
      outcome: { kind: 'escaped', gameOwned: true },
      model: { title: 'escaped' },
      payload: { outcome: { kind: 'escaped', gameOwned: true } },
    }, undefined);
    cleanup();
    expect(destroy).toHaveBeenCalledOnce();
  });
});
