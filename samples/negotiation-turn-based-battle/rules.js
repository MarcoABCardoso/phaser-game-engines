import { approaches, leadingDelegate } from './battle.js';

const cloneState = (state) => structuredClone(state);

export const negotiationRules = {
  createInitialState: cloneState,

  getTurnOrder(state) {
    return state.delegates;
  },

  getAvailableCommands(state, actorId) {
    return approaches.map((approach) => ({ id: approach.id, actorId }));
  },

  resolveCommand(state, command) {
    const approach = approaches.find((candidate) => candidate.id === command.id);
    return {
      changes: [{
        type: 'increment',
        path: ['support', command.actorId],
        value: approach.support,
      }],
      effects: [{
        id: 'present-argument',
        approach: command.id,
        speaker: command.actorId,
      }],
    };
  },

  getOutcome(state, context) {
    if (context.machine.round <= state.roundLimit) return null;
    return {
      agreement: leadingDelegate(state.support),
      support: state.support,
    };
  },
};
