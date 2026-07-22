import { describe, expect, it, vi } from 'vitest';
import { Inventory } from '../src/headless.js';

describe('Inventory', () => {
  it('adds items until capacity and returns snapshots', () => {
    const inventory = new Inventory({ itemSlots: 2, equipmentSlots: ['hand'] });
    expect(inventory.add({ id: 'a' })).toEqual({ kind: 'item', index: 0 });
    expect(inventory.add({ id: 'b' })).toEqual({ kind: 'item', index: 1 });
    expect(inventory.add({ id: 'c' })).toBeNull();
    expect(inventory.snapshot().items.map((item) => item.id)).toEqual(['a', 'b']);
  });

  it('moves and swaps only when both equipment destinations accept their items', () => {
    const inventory = new Inventory({
      itemSlots: 2,
      equipmentSlots: ['hand', 'neck'],
      items: [{ id: 'sword', tags: ['equip:hand'] }, { id: 'ring', tags: ['equip:neck'] }],
    });
    expect(inventory.move({ kind: 'item', index: 0 }, { kind: 'equipment', slot: 'hand' })).toBe(true);
    expect(inventory.move({ kind: 'item', index: 1 }, { kind: 'equipment', slot: 'hand' })).toBe(false);
    expect(inventory.get({ kind: 'equipment', slot: 'hand' }).id).toBe('sword');
  });

  it('delegates sort, use, and change notifications to game policy', () => {
    const listener = vi.fn();
    const inventory = new Inventory({
      itemSlots: 3,
      items: [{ id: 'z', tags: ['usable'] }, null, { id: 'a' }],
    }, { rules: { useItem: () => ({ consume: true }) } });
    inventory.subscribe(listener);
    inventory.sort((a, b) => a.id.localeCompare(b.id));
    expect(inventory.snapshot().items.map((item) => item?.id ?? null)).toEqual(['a', 'z', null]);
    expect(inventory.use({ kind: 'item', index: 1 })).toEqual({ consume: true });
    expect(inventory.snapshot().items[1]).toBeNull();
    expect(listener.mock.calls.map(([event]) => event.type)).toEqual(['sorted', 'removed']);
  });

  it('supports fully custom equipment rules', () => {
    const inventory = new Inventory({ itemSlots: 1, equipmentSlots: ['any'], items: [{ kind: 'quest' }] }, {
      rules: { canEquip: (item, slot) => item.kind === slot },
    });
    expect(inventory.canMove({ kind: 'item', index: 0 }, { kind: 'equipment', slot: 'any' })).toBe(false);
  });
});

