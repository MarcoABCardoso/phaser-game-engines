import Phaser from 'phaser';
import { InventoryScene as ToolkitInventoryScene, createInventoryDragDropRecipe } from '@phaser-game-engines/toolkit/inventory';
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
        renderItem: (scene, item, { x, y, size }) => scene.add.container(x, y, [
          scene.add.rectangle(0, 0, size, size, item.color).setStrokeStyle(2, 0xffffff, 0.6),
          scene.add.text(0, 0, item.label, {
            fontFamily: 'sans-serif', fontSize: '13px', color: '#08111f', align: 'center',
            wordWrap: { width: size - 8 },
          }).setOrigin(0.5),
        ]),
        onActivate: (scene, item, { location }) => scene.activateItem(item, location),
      })],
    });
  }

  getInventory() { return campaign.inventory; }

  createInventoryDisplay() {
    this.cameras.main.setBackgroundColor('#0f172a');
    this.add.text(32, 24, 'Inventory', { fontFamily: 'sans-serif', fontSize: '30px', color: '#ffffff' });
    this.add.text(32, 66, 'Drag to equip · Double-click tonic to use · S: sort · I/Esc: close', {
      fontFamily: 'sans-serif', fontSize: '16px', color: '#cbd5e1',
    });
    this.stats = this.add.text(690, 118, '', {
      fontFamily: 'monospace', fontSize: '17px', color: '#bae6fd', lineSpacing: 8,
      wordWrap: { width: 235 },
    });
    this.keys = this.input.keyboard.addKeys({
      close: Phaser.Input.Keyboard.KeyCodes.I,
      escape: Phaser.Input.Keyboard.KeyCodes.ESC,
      sort: Phaser.Input.Keyboard.KeyCodes.S,
    });
  }

  renderInventoryState(state) {
    const player = campaign.snapshot().player;
    const stats = campaign.playerStats();
    this.stats.setText([
      'Player data',
      `HP ${player.hp}/${player.maxHp}`,
      `Attack ${stats.attack}`,
      `Defense ${stats.defense}`,
      '',
      this.itemMessage ?? 'Equipment changes battle stats.',
    ]);
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
    if (Phaser.Input.Keyboard.JustDown(this.keys.close) || Phaser.Input.Keyboard.JustDown(this.keys.escape)) this.close();
  }

  close() {
    this.scene.wake('world');
    this.scene.stop();
  }
}
