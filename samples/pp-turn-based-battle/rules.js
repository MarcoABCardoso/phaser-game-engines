import {
  availableMoves,
  findCreature,
  readyCreatures,
} from './battle.js';

const cloneState = (state) => structuredClone(state);

export const battleRules = {
  createInitialState: cloneState,

  getTurnOrder(state) {
    return readyCreatures(state).map((creature) => creature.id);
  },

  getAvailableCommands(state, actorId) {
    const actor = findCreature(state, actorId);
    return availableMoves(actor).map((move) => ({
      id: 'useMove',
      actorId,
      moveId: move.id,
    }));
  },

  resolveCommand(state, command) {
    const nextState = cloneState(state);
    const actor = findCreature(nextState, command.actorId);
    const target = findCreature(nextState, command.targetId);
    const move = actor.moves.find((candidate) => candidate.id === command.moveId);

    move.pp -= 1;
    if (target.weakTo === move.type) target.condition = 'fainted';

    return {
      state: nextState,
      events: [{ type: 'moveUsed', detail: { command } }],
    };
  },

  getOutcome(state) {
    const survivors = readyCreatures(state);
    const someoneFainted = state.creatures.some(
      (creature) => creature.condition === 'fainted',
    );

    return survivors.length === 1 && someoneFainted
      ? { winner: survivors[0].id }
      : null;
  },
};
