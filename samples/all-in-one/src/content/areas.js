export const areas = Object.freeze({
  camp: Object.freeze({
    id: 'camp',
    label: 'Expedition camp',
    mapKey: 'area:camp',
    mapUrl: 'maps/camp.json',
    entries: Object.freeze({
      start: Object.freeze({ x: 110, y: 270 }),
      'from-grove': Object.freeze({ x: 845, y: 270 }),
    }),
  }),
  grove: Object.freeze({
    id: 'grove',
    label: 'Signal grove',
    mapKey: 'area:grove',
    mapUrl: 'maps/grove.json',
    entries: Object.freeze({
      'from-camp': Object.freeze({ x: 110, y: 270 }),
    }),
  }),
});

export const encounterCatalog = Object.freeze({
  'training-drone': Object.freeze({
    label: 'Training drones',
    enemies: Object.freeze([
      Object.freeze({ id: 'drone-alpha', label: 'Drone Alpha', hp: 6, maxHp: 6, attack: 4, defense: 2, color: 0xef4444 }),
      Object.freeze({ id: 'drone-beta', label: 'Drone Beta', hp: 6, maxHp: 6, attack: 4, defense: 1, color: 0xf97316 }),
    ]),
  }),
});

export function getArea(areaId) {
  const area = areas[areaId];
  if (!area) throw new Error(`Unknown sample area: ${areaId}`);
  return area;
}

export function resolveAreaEntry(areaId, entryId) {
  const area = getArea(areaId);
  const entry = area.entries[entryId];
  if (!entry) throw new Error(`Unknown entry ${entryId} in sample area ${areaId}`);
  return structuredClone(entry);
}

export function getEncounter(encounterId) {
  const encounter = encounterCatalog[encounterId];
  if (!encounter) throw new Error(`Unknown sample encounter: ${encounterId}`);
  return structuredClone(encounter);
}
