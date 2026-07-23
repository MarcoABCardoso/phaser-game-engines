export function inventoryActionForItem(item) {
  const equipmentTag = item?.tags?.find((tag) => tag.startsWith('equip:'));
  if (equipmentTag) return { kind: 'equip', slot: equipmentTag.slice('equip:'.length) };
  if (item?.tags?.includes('usable')) return { kind: 'use' };
  return { kind: 'none' };
}
