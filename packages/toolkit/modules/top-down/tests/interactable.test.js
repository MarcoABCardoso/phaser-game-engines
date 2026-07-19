import { describe, expect, it, vi } from 'vitest';
import Interactable from '../src/entities/Interactable.js';

function makeScene() {
  const actions = [];
  return {
    player: { x: 10, y: 10 },
    actions,
    add: {
      rectangle: () => ({ setDepth() { return this; } }),
    },
    offerContextualAction(action) { actions.push(action); },
    interact: vi.fn(),
  };
}

describe('top-down interactable actions', () => {
  it('offers an action without reading input or executing it', () => {
    const scene = makeScene();
    const entity = new Interactable({
      id: 'guide',
      x: 10,
      y: 10,
      zone: { x: 0, y: 0, w: 20, h: 20 },
      label: 'Talk',
      priority: 7,
    });
    entity.spawn(scene);
    entity.update(scene);

    expect(scene.actions).toHaveLength(1);
    expect(scene.actions[0]).toMatchObject({
      id: 'interact:guide',
      label: 'Talk',
      priority: 7,
      source: entity,
    });
    expect(scene.interact).not.toHaveBeenCalled();

    scene.actions[0].execute();
    expect(scene.interact).toHaveBeenCalledWith(entity);
  });

  it('offers nothing while the player is outside its zone', () => {
    const scene = makeScene();
    scene.player = { x: 100, y: 100 };
    const entity = new Interactable({
      id: 'guide',
      x: 10,
      y: 10,
      zone: { x: 0, y: 0, w: 20, h: 20 },
    });
    entity.spawn(scene);
    entity.update(scene);
    expect(scene.actions).toEqual([]);
  });
});
