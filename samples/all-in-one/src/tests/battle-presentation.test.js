import { describe, expect, test, vi } from 'vitest';
import { createBattleField } from '../presentation/battle-presentation.js';

function createDisplayObject(properties = {}) {
  return {
    alpha: 1,
    scaleX: 1,
    scaleY: 1,
    visible: true,
    ...properties,
    destroy: vi.fn(),
    add: vi.fn(),
    setAlpha(value) { this.alpha = value; return this; },
    setStrokeStyle: vi.fn(function setStrokeStyle() { return this; }),
    setText: vi.fn(),
    setVisible(value) { this.visible = value; return this; },
  };
}

function createHarness() {
  const tweens = [];
  const player = { root: createDisplayObject({ x: 42, y: 244 }), update: vi.fn(), destroy: vi.fn() };
  const enemy = { root: createDisplayObject({ x: 690, y: 105 }), update: vi.fn(), destroy: vi.fn() };
  const scene = {
    add: {
      rectangle: () => createDisplayObject(),
      ellipse: () => createDisplayObject(),
      polygon: vi.fn(() => createDisplayObject()),
      text: () => createDisplayObject(),
    },
    cameras: { main: { setBackgroundColor: vi.fn(), shake: vi.fn() } },
    createPrefab: vi.fn((name) => name === 'battle.player' ? player : enemy),
    tweens: { add: vi.fn((config) => { tweens.push(config); return config; }) },
  };
  const model = {
    label: 'Test',
    state: {
      game: {
        player: { hp: 10, maxHp: 10 },
        enemies: { alpha: { id: 'alpha', hp: 4, maxHp: 4 } },
      },
    },
    status: '',
  };
  return { scene, field: createBattleField({ scene, model }), player, enemy, tweens };
}

describe('all-in-one battle presentation', () => {
  test('player and enemy attacks wind up and lunge in opposite directions', () => {
    const playerAttack = createHarness();
    playerAttack.field.body.play({
      type: 'all-in-one.attack', actorId: 'player', targetId: 'alpha', defeated: false,
    }, { onImpact: vi.fn(), onComplete: vi.fn() });
    expect(playerAttack.tweens[0].x).toBe(22);
    playerAttack.tweens[0].onComplete();
    expect(playerAttack.tweens[1].x).toBe(114);

    const enemyAttack = createHarness();
    enemyAttack.field.body.play({
      type: 'all-in-one.attack', actorId: 'alpha', targetId: 'player', defeated: false,
    }, { onImpact: vi.fn(), onComplete: vi.fn() });
    expect(enemyAttack.tweens[0].x).toBe(710);
    enemyAttack.tweens[0].onComplete();
    expect(enemyAttack.tweens[1].x).toBe(618);
  });

  test('impact shakes, flashes the target three times, and phases out a defeated target', () => {
    const { scene, field, enemy, tweens } = createHarness();
    const impact = vi.fn();
    const complete = vi.fn();
    field.body.play({
      type: 'all-in-one.attack', actorId: 'player', targetId: 'alpha', defeated: true,
    }, { onImpact: impact, onComplete: complete });

    tweens[0].onComplete();
    expect(impact).not.toHaveBeenCalled();
    tweens[1].onComplete();
    expect(impact).toHaveBeenCalledOnce();
    expect(scene.cameras.main.shake).toHaveBeenCalledWith(140, 0.006);
    expect(tweens[2]).toMatchObject({ targets: enemy.root, yoyo: true, repeat: 2 });
    tweens[2].onComplete();
    expect(complete).not.toHaveBeenCalled();
    expect(tweens[4]).toMatchObject({ targets: enemy.root, alpha: 0, scaleX: 0.12 });
    tweens[4].onComplete();
    expect(enemy.root.visible).toBe(false);
    expect(complete).toHaveBeenCalledOnce();
  });

  test('guard pulses a staggered translucent hex shield before the turn continues', () => {
    const { scene, field, enemy, tweens } = createHarness();
    const impact = vi.fn();
    const complete = vi.fn();
    field.body.play({ type: 'all-in-one.guard', actorId: 'alpha' }, { onImpact: impact, onComplete: complete });

    expect(impact).toHaveBeenCalledOnce();
    expect(scene.add.polygon).toHaveBeenCalledTimes(7);
    expect(enemy.root.add).toHaveBeenCalledTimes(7);
    expect(tweens.map(({ delay }) => delay)).toEqual([0, 55, 110, 165, 220, 275, 330]);
    for (const tween of tweens) tween.onComplete();
    expect(complete).toHaveBeenCalledOnce();
  });
});
