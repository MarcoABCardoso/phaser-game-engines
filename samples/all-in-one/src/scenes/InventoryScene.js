import Phaser from 'phaser';
import { InventoryScene as ToolkitInventoryScene, createInventoryDragDropRecipe } from '@phaser-game-engines/toolkit/inventory';
import { createInventoryShell, renderInventoryItem } from '../presentation/inventory-presentation.js';
import { campaign } from '../state/campaign.js';
import { audioDirector } from '../presentation/audio-director.js';
import { createMenuGamepad } from '../input/menu-gamepad.js';
import { inventoryActionForItem } from '../rules/inventory-actions.js';

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
    audioDirector.transition('inventory', { enabled: campaign.snapshot().settings.audio });
    this.selectedItemIndex = 0;
    this.inventoryShell = this.present('inventory.shell');
    this.keys = this.input.keyboard.addKeys({
      close: Phaser.Input.Keyboard.KeyCodes.I,
      escape: Phaser.Input.Keyboard.KeyCodes.ESC,
      sort: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      confirm: Phaser.Input.Keyboard.KeyCodes.Z,
      enter: Phaser.Input.Keyboard.KeyCodes.ENTER,
    });
    this.keys.escape.on('down', this.close, this);
    this.menuGamepad = createMenuGamepad();
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
      settings: campaign.snapshot().settings,
      selectedItemIndex: this.selectedItemIndex,
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
    const pad = this.menuGamepad.read(this.input.gamepad?.getPad(0));
    if (pad.cancel) {
      this.close();
      return;
    }
    const horizontal = Phaser.Input.Keyboard.JustDown(this.keys.left) || pad.left ? -1
      : Phaser.Input.Keyboard.JustDown(this.keys.right) || pad.right ? 1 : 0;
    const vertical = Phaser.Input.Keyboard.JustDown(this.keys.up) || pad.up ? -4
      : Phaser.Input.Keyboard.JustDown(this.keys.down) || pad.down ? 4 : 0;
    if (horizontal || vertical) this.moveSelection(horizontal || vertical);
    if (Phaser.Input.Keyboard.JustDown(this.keys.confirm)
      || Phaser.Input.Keyboard.JustDown(this.keys.enter)
      || pad.confirm) this.activateSelected();
    if (Phaser.Input.Keyboard.JustDown(this.keys.sort)) campaign.sortInventory();
    if (Phaser.Input.Keyboard.JustDown(this.keys.close)) this.close();
  }

  moveSelection(delta) {
    const count = campaign.inventory.itemSlotCount;
    this.selectedItemIndex = (this.selectedItemIndex + delta + count) % count;
    const item = campaign.inventory.get({ kind: 'item', index: this.selectedItemIndex });
    this.itemMessage = item ? `Selected ${item.label}. Z/Enter or gamepad A activates it.` : 'Selected empty item slot.';
    this.refresh();
  }

  activateSelected() {
    const location = { kind: 'item', index: this.selectedItemIndex };
    const item = campaign.inventory.get(location);
    if (!item) return;
    const action = inventoryActionForItem(item);
    if (action.kind === 'equip') {
      const { slot } = action;
      const moved = campaign.inventory.move(location, { kind: 'equipment', slot });
      this.itemMessage = moved ? `${item.label} equipped in ${slot}.` : `${item.label} could not be equipped.`;
      this.refresh();
      return;
    }
    if (action.kind === 'use') this.activateItem(item, location);
  }

  close() {
    const areaId = campaign.snapshot().world.areaId;
    audioDirector.transition(areaId, { enabled: campaign.snapshot().settings.audio });
    this.scene.wake('world');
    this.scene.stop();
  }
}
