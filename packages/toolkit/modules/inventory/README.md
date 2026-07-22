# @phaser-game-engines/toolkit/inventory

A generic slot inventory with an optional Phaser drag-and-drop screen. Import
`@phaser-game-engines/toolkit/inventory/headless` for state and rules without
loading Phaser.

```js
import { Inventory } from '@phaser-game-engines/toolkit/inventory/headless';

const inventory = new Inventory({ itemSlots: 12, equipmentSlots: ['weapon', 'charm'] }, {
  rules: {
    canEquip: (item, slot) => item.tags.includes(`equip:${slot}`),
    canUse: (item) => item.tags.includes('usable'),
    useItem: (item, { context }) => context.heal(item.restore) && { consume: true },
  },
});
inventory.add({ id: 'tonic-1', label: 'Tonic', tags: ['usable'], restore: 5 });
inventory.move({ kind: 'item', index: 0 }, { kind: 'equipment', slot: 'charm' });
inventory.sort((a, b) => a.label.localeCompare(b.label));
```

Items are opaque game-owned values. `add`, `remove`, `move`, `sort`, `use`,
`snapshot`, and `subscribe` provide the persistent data layer. Moves swap
occupied slots atomically and equipment rules are checked in both directions.
Without a rules adapter, `usable`, `equipmentSlots`, `equippable`, and tags such
as `usable` or `equip:weapon` provide convenient defaults.

Extend `InventoryScene`, return the persistent model from `getInventory()`, and
install `createInventoryDragDropRecipe()` for pointer/touch controls. Override
`pgeCreateInventoryDisplay()` and `pgeRenderInventoryState()` to place stats, health,
descriptions, or any other game-owned data beside the slots. Supply `onActivate`
to handle a double-click on an item, such as delegating to `inventory.use()`.

The `pge` prefix marks methods that the toolkit invokes as scene extension
hooks; unprefixed methods remain game-owned helpers or callable scene APIs.

```js
class BagScene extends InventoryScene {
  constructor() {
    super({ key: 'bag', recipes: [createInventoryDragDropRecipe()] });
  }
  getInventory() { return campaign.inventory; }
}
```
