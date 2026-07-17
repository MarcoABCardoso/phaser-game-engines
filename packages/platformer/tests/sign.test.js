import { describe, expect, it, vi } from 'vitest';
import Sign from '../src/entities/Sign.js';

function makeScene(player = { x: 10, y: 10 }) {
  const actions = [];
  return {
    player,
    actions,
    dialogActive: false,
    offerContextualAction(action) { actions.push(action); },
    startDialog: vi.fn(),
  };
}

describe('platformer sign actions', () => {
  it('offers a readable action without reading input directly', () => {
    const scene = makeScene();
    const sign = new Sign({
      id: 'warning',
      zone: { x: 0, y: 0, w: 20, h: 20 },
      dialogId: 'warning-dialog',
      label: 'Inspect warning',
      priority: 4,
    });
    sign.update(scene);

    expect(scene.actions).toHaveLength(1);
    expect(scene.actions[0]).toMatchObject({
      id: 'read:warning',
      kind: 'readable',
      label: 'Inspect warning',
      priority: 4,
      source: sign,
    });
    expect(scene.startDialog).not.toHaveBeenCalled();
    scene.actions[0].execute();
    expect(scene.startDialog).toHaveBeenCalledWith('warning-dialog');
  });

  it('offers nothing outside its interaction zone', () => {
    const scene = makeScene({ x: 100, y: 100 });
    const sign = new Sign({
      id: 'warning',
      zone: { x: 0, y: 0, w: 20, h: 20 },
      dialogId: 'warning-dialog',
    });
    sign.update(scene);
    expect(scene.actions).toEqual([]);
  });
});
