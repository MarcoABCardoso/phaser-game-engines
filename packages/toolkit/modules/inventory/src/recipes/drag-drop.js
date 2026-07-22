import Phaser from 'phaser';
import { defineRecipe } from '@phaser-game-engines/toolkit/core';

/** A mouse/touch drag-and-drop grid. Games retain item rendering and rule policy. */
export function createInventoryDragDropRecipe(options = {}) {
  return defineRecipe({
    id: options.id ?? 'inventory.drag-drop',
    owns: ['inventory.slot-presentation', 'inventory.pointer-controls'],
    policies: { dragDrop: (scene) => installDragDrop(scene, options) },
  });
}

function installDragDrop(scene, options) {
  const slotSize = options.slotSize ?? 72;
  const gap = options.gap ?? 10;
  const columns = options.columns ?? 5;
  const origin = { x: options.x ?? 32, y: options.y ?? 92 };
  const equipmentX = options.equipmentX ?? origin.x + columns * (slotSize + gap) + 48;
  const equipmentY = options.equipmentY ?? origin.y;
  const slots = [];
  const cards = [];
  let lastActivation = null;

  const addSlot = (x, y, location, label) => {
    const zone = scene.add.rectangle(x, y, slotSize, slotSize, options.slotColor ?? 0x1f2937)
      .setStrokeStyle(2, options.slotBorderColor ?? 0x64748b)
      .setInteractive({ dropZone: true });
    zone.inventoryLocation = location;
    slots.push(zone);
    if (label) slots.push(scene.add.text(x, y - slotSize / 2 - 8, label, {
      fontFamily: options.fontFamily ?? 'sans-serif', fontSize: `${options.labelSize ?? 14}px`, color: options.labelColor ?? '#cbd5e1',
    }).setOrigin(0.5, 1));
  };

  for (let index = 0; index < scene.inventory.itemSlotCount; index += 1) {
    addSlot(
      origin.x + (index % columns) * (slotSize + gap) + slotSize / 2,
      origin.y + Math.floor(index / columns) * (slotSize + gap) + slotSize / 2,
      { kind: 'item', index },
      options.showItemSlotLabels ? String(index + 1) : '',
    );
  }
  scene.inventory.equipmentSlots.forEach((slot, index) => addSlot(
    equipmentX + slotSize / 2,
    equipmentY + index * (slotSize + gap) + slotSize / 2,
    { kind: 'equipment', slot },
    options.formatEquipmentSlot?.(slot, scene) ?? slot,
  ));

  const clearCards = () => { while (cards.length) cards.pop().destroy(); };
  const renderCard = (item, x, y, location) => {
    const custom = options.renderItem?.(scene, item, { x, y, size: slotSize - 10, location });
    const card = custom ?? scene.add.container(x, y, [
      scene.add.rectangle(0, 0, slotSize - 10, slotSize - 10, options.itemColor ?? 0x334155).setStrokeStyle(1, 0x94a3b8),
      scene.add.text(0, 0, options.getItemLabel?.(item, scene) ?? item.label ?? item.name ?? String(item.id ?? item), {
        fontFamily: options.fontFamily ?? 'sans-serif', fontSize: `${options.itemTextSize ?? 14}px`, color: '#ffffff',
        align: 'center', wordWrap: { width: slotSize - 16 },
      }).setOrigin(0.5),
    ]);
    card.setPosition(x, y).setSize(slotSize - 10, slotSize - 10).setInteractive({ useHandCursor: true });
    scene.input.setDraggable(card);
    card.inventoryLocation = location;
    card.inventoryHome = { x, y };
    if (options.onActivate) {
      card.on('pointerup', (pointer) => {
        const at = pointer.upTime ?? scene.time.now;
        const key = `${item.id ?? String(item)}:${location.kind}:${location.index ?? location.slot}`;
        if (lastActivation?.key === key && at - lastActivation.at <= (options.activationDelayMs ?? 350)) {
          lastActivation = null;
          options.onActivate(scene, item, { location });
        } else {
          lastActivation = { key, at };
        }
      });
    }
    cards.push(card);
  };
  const render = ({ state }) => {
    clearCards();
    state.items.forEach((item, index) => {
      if (item != null) renderCard(item,
        origin.x + (index % columns) * (slotSize + gap) + slotSize / 2,
        origin.y + Math.floor(index / columns) * (slotSize + gap) + slotSize / 2,
        { kind: 'item', index });
    });
    scene.inventory.equipmentSlots.forEach((slot, index) => {
      const item = state.equipment[slot];
      if (item != null) renderCard(item, equipmentX + slotSize / 2,
        equipmentY + index * (slotSize + gap) + slotSize / 2, { kind: 'equipment', slot });
    });
  };
  const drag = (_pointer, object, dragX, dragY) => {
    if (!object.inventoryLocation) return;
    object.setPosition(dragX, dragY).setDepth(options.dragDepth ?? 1000);
  };
  const drop = (_pointer, object, zone) => {
    if (!object.inventoryLocation || !zone.inventoryLocation) return;
    object.inventoryDropped = scene.moveInventoryItem(object.inventoryLocation, zone.inventoryLocation);
    if (!object.inventoryDropped) object.setPosition(object.inventoryHome.x, object.inventoryHome.y).setDepth(0);
  };
  const dragend = (_pointer, object, dropped) => {
    if (!object.inventoryLocation) return;
    if (!dropped || !object.inventoryDropped) object.setPosition(object.inventoryHome.x, object.inventoryHome.y);
    object.setDepth(0);
    object.inventoryDropped = false;
  };
  scene.input.on(Phaser.Input.Events.DRAG, drag);
  scene.input.on(Phaser.Input.Events.DROP, drop);
  scene.input.on(Phaser.Input.Events.DRAG_END, dragend);
  const stopRefresh = scene.lifecycle.on('refresh', render);
  return () => {
    stopRefresh();
    scene.input.off(Phaser.Input.Events.DRAG, drag);
    scene.input.off(Phaser.Input.Events.DROP, drop);
    scene.input.off(Phaser.Input.Events.DRAG_END, dragend);
    clearCards();
    for (const object of slots) object.destroy();
  };
}
