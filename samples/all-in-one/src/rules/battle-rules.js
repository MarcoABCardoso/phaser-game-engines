export function calculateDamage(attacker, defender, rng = Math.random) {
  const variance = Math.floor(rng() * 3);
  const effectiveDefense = defender.defense * (defender.guarding ? 2 : 1);
  return Math.max(1, attacker.attack - effectiveDefense + variance);
}

function getFighter(state, id) {
  return id === 'player' ? state.player : state.enemies[id];
}

export const battleRules = {
  createInitialState: (spec) => ({
    player: { ...spec.player, guarding: false },
    enemies: Object.fromEntries(spec.enemies.map((enemy) => [
      enemy.id,
      { ...enemy, guarding: false },
    ])),
    turn: 0,
  }),
  getTurnOrder: (state) => [
    ...(state.player.hp > 0 ? ['player'] : []),
    ...Object.values(state.enemies).filter((enemy) => enemy.hp > 0).map((enemy) => enemy.id),
  ],
  getAvailableCommands: (_state, actorId) => [
    { id: 'attack', actorId },
    { id: 'guard', actorId },
  ],
  onTurnStart: (state, context) => {
    const activeId = context.machine.activeId;
    const active = getFighter(state, activeId);
    if (!active.guarding) return null;
    return activeId === 'player'
      ? { state: { ...state, player: { ...active, guarding: false } } }
      : {
        state: {
          ...state,
          enemies: { ...state.enemies, [activeId]: { ...active, guarding: false } },
        },
      };
  },
  resolveCommand: (state, command, context) => {
    const next = {
      ...state,
      player: { ...state.player },
      enemies: Object.fromEntries(Object.entries(state.enemies).map(([id, enemy]) => [id, { ...enemy }])),
      turn: state.turn + 1,
    };
    const actor = getFighter(next, command.actorId);
    if (command.id === 'guard') {
      actor.guarding = true;
      return {
        state: next,
        events: [{ type: 'guardRaised', detail: { actorId: command.actorId } }],
      };
    }

    const targetId = command.targetId ?? (command.actorId === 'player' ? null : 'player');
    const target = getFighter(next, targetId);
    if (!target || target.hp <= 0) throw new Error('Attack target must be an active fighter.');
    const damage = calculateDamage(actor, target, context.rng);
    target.hp = Math.max(0, target.hp - damage);
    const defeated = target.hp === 0;
    return {
      state: next,
      schedule: defeated && targetId !== 'player' ? { remove: [targetId] } : undefined,
      events: [{
        type: 'damageDealt',
        detail: { actorId: command.actorId, targetId, damage, guarded: target.guarding, defeated },
      }],
    };
  },
  validateCommand: (state, command) => command.id !== 'attack'
    || (command.actorId === 'player'
      ? Boolean(state.enemies[command.targetId]?.hp > 0)
      : command.targetId === 'player'),
  getOutcome: (state) => Object.values(state.enemies).every((enemy) => enemy.hp <= 0)
    ? { kind: 'won', playerHp: state.player.hp }
    : state.player.hp <= 0
      ? { kind: 'lost', playerHp: 0 }
      : null,
};
