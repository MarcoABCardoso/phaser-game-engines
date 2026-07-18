export const battleSpec = {
  creatures: [
    {
      id: 'sprig',
      name: 'Sprig',
      type: 'leaf',
      weakTo: 'flame',
      condition: 'ready',
      moves: [{ id: 'vine', type: 'leaf', pp: 2 }],
    },
    {
      id: 'cinder',
      name: 'Cinder',
      type: 'flame',
      weakTo: 'leaf',
      condition: 'ready',
      moves: [{ id: 'spark', type: 'flame', pp: 2 }],
    },
  ],
};

export function findCreature(state, creatureId) {
  return state.creatures.find((creature) => creature.id === creatureId);
}

export function readyCreatures(state) {
  return state.creatures.filter((creature) => creature.condition === 'ready');
}

export function availableMoves(creature) {
  return creature.moves.filter((move) => move.pp > 0);
}
