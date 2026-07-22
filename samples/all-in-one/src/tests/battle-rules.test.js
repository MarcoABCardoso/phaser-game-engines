import { describe, expect, test } from 'vitest';
import { Battle } from '@phaser-game-engines/toolkit/battle/headless';
import { battleRules, calculateDamage } from '../rules/battle-rules.js';

const enemies = [
  { id: 'alpha', label: 'Alpha', hp: 6, maxHp: 6, attack: 4, defense: 2 },
  { id: 'beta', label: 'Beta', hp: 6, maxHp: 6, attack: 4, defense: 1 },
];

describe('all-in-one battle rules', () => {
  test('damage uses attack, defense, guard, and a hidden random roll', () => {
    const attacker = { attack: 5 };
    const defender = { defense: 2, guarding: false };
    expect(calculateDamage(attacker, defender, () => 0)).toBe(3);
    expect(calculateDamage(attacker, defender, () => 0.999)).toBe(5);
    expect(calculateDamage(attacker, { ...defender, guarding: true }, () => 0)).toBe(1);
  });

  test('rushing the encounter with base stats loses', () => {
    const battle = new Battle({
      player: { hp: 8, maxHp: 12, attack: 3, defense: 1 },
      enemies,
    }, { rules: battleRules, rng: () => 0 });
    battle.start();
    while (!battle.state.machine.outcome) {
      const actorId = battle.state.machine.activeId;
      const targetId = actorId === 'player'
        ? Object.values(battle.state.game.enemies).find((enemy) => enemy.hp > 0).id
        : 'player';
      battle.submitCommand({ id: 'attack', actorId, targetId });
    }
    expect(battle.state.machine.outcome.kind).toBe('lost');
  });

  test('equipment stats and guarding support a winning strategy', () => {
    const battle = new Battle({
      player: { hp: 12, maxHp: 12, attack: 5, defense: 3 },
      enemies,
    }, { rules: battleRules, rng: () => 0 });
    battle.start();
    let playerTurns = 0;
    while (!battle.state.machine.outcome) {
      const actorId = battle.state.machine.activeId;
      const id = actorId !== 'player' || playerTurns % 2 === 0 ? 'attack' : 'guard';
      const targetId = actorId === 'player'
        ? Object.values(battle.state.game.enemies).find((enemy) => enemy.hp > 0).id
        : 'player';
      battle.submitCommand({ id, actorId, ...(id === 'attack' ? { targetId } : {}) });
      if (actorId === 'player') playerTurns += 1;
    }
    expect(battle.state.machine.outcome.kind).toBe('won');
    expect(battle.state.machine.outcome.playerHp).toBeGreaterThan(0);
  });

  test('defeated enemies disappear from the current queue and future rounds', () => {
    const events = [];
    const battle = new Battle({
      player: { hp: 12, maxHp: 12, attack: 9, defense: 3 },
      enemies,
    }, { rules: battleRules, rng: () => 0, emit: (type, payload) => events.push({ type, payload }) });
    battle.start();
    battle.submitCommand({ id: 'attack', actorId: 'player', targetId: 'alpha' });
    expect(battle.state.game.enemies.alpha.hp).toBe(0);
    expect(battle.state.machine.queue).not.toContain('alpha');
    expect(events.some(({ type, payload }) => type === 'scheduleChanged' && !payload.schedule.includes('alpha'))).toBe(true);
  });
});
