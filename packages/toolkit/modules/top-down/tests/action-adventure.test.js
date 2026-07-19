import { describe, expect, it, vi } from 'vitest';
import { createCapabilities, createLifecycle, lifecycleEvent } from '@phaser-game-engines/toolkit/core';
import { createActionAdventureRecipe } from '../src/recipes/action-adventure.js';

describe('action-adventure recipe', () => {
  it('owns combat state and removes its listener and scene resource', () => {
    const receive = vi.fn();
    const target = {
      capabilities: createCapabilities({
        targetable: { inRange: () => true },
        damageReceiver: { receive },
      }),
    };
    const lifecycle = createLifecycle();
    const scene = {
      lifecycle,
      inputIntent: { actions: { primary: { pressed: true, down: true } } },
      entities: { firstWithCapability: () => target },
      player: {},
      statusText: () => '',
      time: { now: 100 },
    };
    const mechanic = createActionAdventureRecipe({ maxHealth: 3 }).policies.actionAdventure;
    const remove = mechanic(scene);

    expect(scene.health).toBeUndefined();
    expect(scene.actionAdventure.health).toBe(3);
    lifecycle.emit(lifecycleEvent.tick, { scene, time: 100, delta: 16 });
    expect(receive).toHaveBeenCalledWith({ scene, source: scene.player, amount: 1 });

    remove();
    expect(scene.actionAdventure).toBeUndefined();
    lifecycle.emit(lifecycleEvent.tick, { scene, time: 400, delta: 16 });
    expect(receive).toHaveBeenCalledTimes(1);
  });
});
