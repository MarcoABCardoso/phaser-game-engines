import { describe, it, expect } from 'vitest';
import Spawner from '@phaser-game-engines/toolkit/platformer/entities/Spawner.js';

// A spawner has no Phaser body, so it drives entirely off a tiny fake scene: a
// player position, a danger tier, and an entities.spawnFromSpec that records what
// would be created.
function makeScene({ player = { x: 0, y: 0 }, tier = 0 } = {}) {
  const emitted = [];
  return {
    player,
    tier,
    emitted,
    currentDangerTier() {
      return this.tier;
    },
    entities: {
      spawnFromSpec(_scene, spec) {
        emitted.push(spec);
        return spec;
      },
    },
  };
}

function make(spec) {
  const s = new Spawner(spec);
  s.spawn(); // no scene needed; sets up internal state
  return s;
}

describe('Spawner: triggers', () => {
  it('onStart fires exactly once and then latches', () => {
    const scene = makeScene();
    const s = make({ type: 'spawner', trigger: { onStart: true }, place: { x: 9, y: 9 }, spawns: [{ type: 'boss' }] });
    s.update(scene, 0, 16);
    s.update(scene, 16, 16);
    s.update(scene, 32, 16);
    expect(scene.emitted).toHaveLength(1);
    expect(scene.emitted[0]).toMatchObject({ type: 'boss', spawn: { x: 9, y: 9 } });
  });

  it('onEnterZone fires on entry, not while staying, and re-arms when repeat', () => {
    const scene = makeScene({ player: { x: -100, y: 0 } });
    const zone = { x: 0, y: 0, w: 50, h: 50 };
    const s = make({ type: 'spawner', trigger: { onEnterZone: zone }, repeat: true, place: { x: 1, y: 1 }, spawns: [{ type: 'boss' }] });

    s.update(scene, 0, 16); // outside
    expect(scene.emitted).toHaveLength(0);

    scene.player = { x: 25, y: 25 };
    s.update(scene, 16, 16); // entered -> fire
    s.update(scene, 32, 16); // still inside -> no fire
    expect(scene.emitted).toHaveLength(1);

    scene.player = { x: -100, y: 0 };
    s.update(scene, 48, 16); // left
    scene.player = { x: 25, y: 25 };
    s.update(scene, 64, 16); // re-entered -> fire again
    expect(scene.emitted).toHaveLength(2);
  });

  it('atDangerTier fires once the tier is reached', () => {
    const scene = makeScene({ tier: 0 });
    const s = make({ type: 'spawner', trigger: { atDangerTier: 2 }, place: { x: 0, y: 0 }, spawns: [{ type: 'boss' }] });
    s.update(scene, 0, 16);
    expect(scene.emitted).toHaveLength(0);
    scene.tier = 2;
    s.update(scene, 16, 16);
    expect(scene.emitted).toHaveLength(1);
  });

  it('every fires on a fixed interval while repeating', () => {
    const scene = makeScene();
    const s = make({ type: 'spawner', trigger: { every: 100 }, repeat: true, place: { x: 0, y: 0 }, spawns: [{ type: 'boss' }] });
    s.update(scene, 0, 60);
    s.update(scene, 60, 60); // accum 120 -> fire once
    expect(scene.emitted).toHaveLength(1);
    s.update(scene, 120, 60); // accum 80
    s.update(scene, 180, 60); // accum 140 -> fire again
    expect(scene.emitted).toHaveLength(2);
  });
});

describe('Spawner: placement and limits', () => {
  it('places each emitted entity via the strategy and gives it a unique id', () => {
    const scene = makeScene();
    const points = [{ x: 1, y: 1 }, { x: 2, y: 2 }];
    const s = make({
      type: 'spawner',
      trigger: { onStart: true },
      place: { points },
      spawns: [{ type: 'boss', count: 3 }],
    });
    s.update(scene, 0, 16);
    expect(scene.emitted.map((e) => e.spawn)).toEqual([
      { x: 1, y: 1 },
      { x: 2, y: 2 },
      { x: 1, y: 1 }, // cycles
    ]);
    const ids = scene.emitted.map((e) => e.id);
    expect(new Set(ids).size).toBe(3); // all unique
    expect(scene.emitted[0]).not.toHaveProperty('count'); // count is consumed, not passed on
  });

  it('never emits more than `limit` total', () => {
    const scene = makeScene();
    const s = make({
      type: 'spawner',
      trigger: { every: 10 },
      repeat: true,
      limit: 2,
      place: { x: 0, y: 0 },
      spawns: [{ type: 'boss' }],
    });
    for (let i = 0; i < 10; i += 1) s.update(scene, i * 10, 10);
    expect(scene.emitted).toHaveLength(2);
  });
});
