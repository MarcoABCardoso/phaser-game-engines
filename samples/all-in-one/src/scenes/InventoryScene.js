import Phaser from 'phaser';
import { InventoryScene as ToolkitInventoryScene, createInventoryDragDropRecipe } from '@phaser-game-engines/toolkit/inventory';
import { createInventoryShell, renderInventoryItem } from '../presentation/inventory-presentation.js';
import { campaign } from '../state/campaign.js';

export class InventoryScene extends ToolkitInventoryScene {
  constructor() {
    super({
      key: 'inventory',
      recipes: [createInventoryDragDropRecipe({
        x: 38,
        y: 118,
        columns: 4,
        equipmentX: 520,
        equipmentY: 150,
        getItemLabel: (item) => item.label,
        renderItem: renderInventoryItem,
        onActivate: (scene, item, { location }) => scene.activateItem(item, location),
      })],
      presentation: { presenters: { 'inventory.shell': createInventoryShell } },
    });
  }

  getInventory() { return campaign.inventory; }

  pgeCreateInventoryDisplay() {
    this.inventoryShell = this.present('inventory.shell');
    this.keys = this.input.keyboard.addKeys({
      close: Phaser.Input.Keyboard.KeyCodes.I,
      escape: Phaser.Input.Keyboard.KeyCodes.ESC,
      sort: Phaser.Input.Keyboard.KeyCodes.S,
    });
    this.keys.escape.on('down', this.close, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.keys.escape.off('down', this.close, this);
    });
  }

  pgeRenderInventoryState(state) {
    const player = campaign.snapshot().player;
    const stats = campaign.playerStats();
    this.inventoryShell.update({
      state,
      player,
      stats,
      message: this.itemMessage ?? 'Equipment changes battle stats.',
    });
  }

  activateItem(item, location) {
    const before = campaign.snapshot().player.hp;
    const result = this.useInventoryItem(location);
    const after = campaign.snapshot().player.hp;
    this.itemMessage = result === false
      ? `${item.label} cannot be used now.`
      : `${item.label} restored ${after - before} HP and was consumed.`;
    this.refresh();
  }

  update(time, delta) {
    super.update(time, delta);
    if (Phaser.Input.Keyboard.JustDown(this.keys.sort)) campaign.sortInventory();
    if (Phaser.Input.Keyboard.JustDown(this.keys.close)) this.close();
  }

  close() {
    this.scene.wake('world');
    this.scene.stop();
  }
}
