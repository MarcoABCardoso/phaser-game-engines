

export const rules = {
  createInitialState: (spec) => ({ ...spec }),
  getTurnOrder: () => ['player', 'rival'],
  getAvailableCommands: (_state, actorId) => [
    { id: 'focus', actorId },
    { id: 'overload', actorId },
  ],
  resolveCommand: (state, command) => {
    const actorKey = command.actorId === 'player' ? 'playerResolve' : 'rivalResolve';
    const targetKey = command.actorId === 'player' ? 'rivalResolve' : 'playerResolve';
    const next = { ...state, turn: state.turn + 1 };
    next[targetKey] -= command.id === 'overload' ? 2 : 1;
    if (command.id === 'overload') next[actorKey] -= 1;
    return { state: next };
  },
  getOutcome: (state) => state.rivalResolve <= 0 ? { kind: 'won' }
    : state.playerResolve <= 0 ? { kind: 'lost' } : null,
};
