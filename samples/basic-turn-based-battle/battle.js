export const battleSpec = {
  units: [
    {
      id: 'luna',
      name: 'Luna',
      side: 'heroes',
      hp: 36,
      maxHp: 36,
      mp: 8,
      maxMp: 8,
      speed: 9,
      power: 7,
    },
    {
      id: 'gaius',
      name: 'Gaius',
      side: 'heroes',
      hp: 44,
      maxHp: 44,
      mp: 0,
      maxMp: 0,
      speed: 5,
      power: 9,
    },
    {
      id: 'imp',
      name: 'Imp',
      side: 'fiends',
      hp: 28,
      maxHp: 28,
      mp: 0,
      maxMp: 0,
      speed: 4,
      power: 4,
    },
  ],
};

export function findUnit(state, unitId) {
  return state.units.find((unit) => unit.id === unitId);
}

export function livingUnits(state, side) {
  return state.units.filter((unit) => unit.side === side && unit.hp > 0);
}

export function opposingSide(side) {
  return side === 'heroes' ? 'fiends' : 'heroes';
}
