export const itemCatalog = Object.freeze({
  tonic: Object.freeze({ label: 'Tonic', color: 0x22c55e, tags: Object.freeze(['usable']), restore: 4 }),
  sword: Object.freeze({ label: 'Rusty sword', color: 0xf59e0b, tags: Object.freeze(['equip:weapon']), attackBonus: 2 }),
  charm: Object.freeze({ label: 'Sky charm', color: 0x38bdf8, tags: Object.freeze(['equip:charm']), defenseBonus: 2 }),
  badge: Object.freeze({ label: 'Field badge', color: 0xc4b5fd, tags: Object.freeze(['quest-reward']) }),
});

export function createItem(kind, instanceId) {
  const definition = itemCatalog[kind];
  if (!definition) throw new Error(`Unknown sample item kind: ${kind}`);
  return { id: instanceId, kind, ...definition, tags: [...definition.tags] };
}
