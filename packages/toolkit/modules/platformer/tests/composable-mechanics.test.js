import { describe, expect, it, vi } from 'vitest';
import { createLifecycle } from '@phaser-game-engines/toolkit/core';
import { createCheckpointMechanic } from '../src/mechanics/checkpoints.js';
import { createDialogueMechanic } from '../src/mechanics/dialogue.js';
import { createHealthMechanic } from '../src/mechanics/health.js';

function sceneFixture() {
  const gates = new Set();
  return {
    lifecycle: createLifecycle(),
    time: { now: 10 },
    level: { checkpoints: [{ id: 'one', zone: { x: 0, y: 0, w: 20, h: 20 } }] },
    player: { x: 10, y: 10, body: { setVelocity: vi.fn(), setAcceleration: vi.fn() } },
    actions: [],
    offerContextualAction(action) { this.actions.push(action); },
    addSimulationGate(gate) { gates.add(gate); return () => gates.delete(gate); },
    gates,
  };
}

describe('independent platformer mechanics', () => {
  it('health owns only its namespaced controller and cleans up', () => {
    const scene = sceneFixture();
    const remove = createHealthMechanic({ max: 3 })(scene);
    scene.platformerHealth.damage(1);
    expect(scene.platformerHealth.current).toBe(2);
    remove();
    expect(scene.platformerHealth).toBeUndefined();
  });

  it('dialogue pauses through a removable simulation gate', () => {
    const scene = sceneFixture();
    const remove = createDialogueMechanic({ conversations: { intro: [{ text: 'Hello' }] } })(scene);
    expect(scene.platformerDialogue.start('intro')).toBe(true);
    expect([...scene.gates][0]()).toBe(true);
    remove();
    expect(scene.gates.size).toBe(0);
    expect(scene.platformerDialogue).toBeUndefined();
  });

  it('checkpoints offer an action and remove their listener', () => {
    const scene = sceneFixture();
    const remove = createCheckpointMechanic()(scene);
    scene.lifecycle.emit('beforeContextualActions', { scene });
    expect(scene.actions[0].id).toBe('checkpoint:activate:one');
    scene.actions.length = 0;
    remove();
    scene.lifecycle.emit('beforeContextualActions', { scene });
    expect(scene.actions).toEqual([]);
  });
});
