import { expect, test } from 'vitest';
import { createItem } from '../content/items.js';
import { inventoryActionForItem } from '../rules/inventory-actions.js';

test('keyboard and gamepad inventory activation shares pointer equipment/use policy', () => {
  expect(inventoryActionForItem(createItem('sword', 'sword'))).toEqual({ kind: 'equip', slot: 'weapon' });
  expect(inventoryActionForItem(createItem('charm', 'charm'))).toEqual({ kind: 'equip', slot: 'charm' });
  expect(inventoryActionForItem(createItem('tonic', 'tonic'))).toEqual({ kind: 'use' });
  expect(inventoryActionForItem(createItem('badge', 'badge'))).toEqual({ kind: 'none' });
});
