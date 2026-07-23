export function renderInventoryItem(scene, item, { x, y, size }) {
  const background = scene.add.rectangle(0, 0, size, size, item.color)
    .setStrokeStyle(2, 0xffffff, 0.6);
  const label = scene.add.text(0, 0, item.label, {
    fontFamily: 'sans-serif', fontSize: '13px', color: '#08111f', align: 'center',
    wordWrap: { width: size - 8 },
  }).setOrigin(0.5);
  return scene.add.container(x, y, [background, label]);
}

export function createInventoryShell({ scene }) {
  scene.cameras.main.setBackgroundColor('#0f172a');
  const title = scene.add.text(32, 24, 'Inventory', {
    fontFamily: 'sans-serif', fontSize: '30px', color: '#ffffff',
  });
  const help = scene.add.text(32, 66, 'Drag/touch or arrows + Z/A to equip/use · S: sort · I/Esc/B: close', {
    fontFamily: 'sans-serif', fontSize: '16px', color: '#cbd5e1',
  });
  const stats = scene.add.text(690, 118, '', {
    fontFamily: 'monospace', fontSize: '17px', color: '#bae6fd', lineSpacing: 8,
    wordWrap: { width: 235 },
  });
  const selectionMarker = scene.add.rectangle(74, 154, 78, 78)
    .setStrokeStyle(3, 0xfde047).setFillStyle(0x000000, 0).setDepth(900);

  return {
    root: stats,
    update(model) {
      selectionMarker.setPosition(
        74 + ((model.selectedItemIndex ?? 0) % 4) * 82,
        154 + Math.floor((model.selectedItemIndex ?? 0) / 4) * 82,
      );
      stats.setScale(model.settings?.textScale ?? 1);
      stats.setText([
        'Player data',
        `HP ${model.player.hp}/${model.player.maxHp}`,
        `Attack ${model.stats.attack}`,
        `Defense ${model.stats.defense}`,
        '',
        model.message,
      ]);
    },
    destroy() {
      selectionMarker.destroy();
      stats.destroy();
      help.destroy();
      title.destroy();
    },
  };
}
