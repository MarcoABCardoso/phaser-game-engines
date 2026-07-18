import { findUnit, livingUnits } from './battle.js';

const CURE_MP_COST = 2;
const CURE_AMOUNT = 9;
const cloneState = (state) => structuredClone(state);

function availableCommandIds(state, actorId) {
  const actor = findUnit(state, actorId);
  const commands = ['strike'];

  if (actorId === 'luna' && actor.mp >= CURE_MP_COST) {
    commands.push('cure');
  }

  return commands;
}

function resolveStrike(state, command) {
  const actor = findUnit(state, command.actorId);
  const target = findUnit(state, command.targetId);
  target.hp = Math.max(0, target.hp - actor.power);
}

function resolveCure(state, command) {
  const actor = findUnit(state, command.actorId);
  const target = findUnit(state, command.targetId);
  actor.mp -= CURE_MP_COST;
  target.hp = Math.min(target.maxHp, target.hp + CURE_AMOUNT);
}

export const battleRules = {
  createInitialState: cloneState,

  getTurnOrder(state) {
    return state.units
      .filter((unit) => unit.hp > 0)
      .sort((a, b) => b.speed - a.speed)
      .map((unit) => unit.id);
  },

  getAvailableCommands(state, actorId) {
    return availableCommandIds(state, actorId);
  },

  validateCommand(state, command, commandIds) {
    return commandIds.includes(command.id);
  },

  resolveCommand(state, command) {
    const nextState = cloneState(state);

    if (command.id === 'cure') {
      resolveCure(nextState, command);
    } else {
      resolveStrike(nextState, command);
    }

    return {
      state: nextState,
      events: [{ type: 'sampleAction', detail: { command } }],
    };
  },

  getOutcome(state) {
    if (!livingUnits(state, 'heroes').length) return { winner: 'fiends' };
    if (!livingUnits(state, 'fiends').length) return { winner: 'heroes' };
    return null;
  },
};
