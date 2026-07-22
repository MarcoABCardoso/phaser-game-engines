export const battleRules = {
  createInitialState: (spec) => ({ ...spec, turn: 0 }),
  getTurnOrder: () => ['player', 'rival'],
  getAvailableCommands: (_state, actorId) => [
    { id: 'focus', actorId },
    { id: 'overload', actorId },
  ],
  resolveCommand: (state, command) => {
    const next = { ...state, turn: state.turn + 1 };
    const target = command.actorId === 'player' ? 'rivalResolve' : 'playerResolve';
    const actor = command.actorId === 'player' ? 'playerResolve' : 'rivalResolve';
    next[target] -= command.id === 'overload' ? 3 : 2;
    if (command.id === 'overload') next[actor] -= 1;
    return { state: next, events: [{ type: 'resolveChanged', detail: { commandId: command.id } }] };
  },
  getOutcome: (state) => state.rivalResolve <= 0 ? { kind: 'won' }
    : state.playerResolve <= 0 ? { kind: 'lost' } : null,
};
