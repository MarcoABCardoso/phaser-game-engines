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
  const help = scene.add.text(32, 66, 'Drag to equip · Double-click tonic to use · S: sort · I/Esc: close', {
    fontFamily: 'sans-serif', fontSize: '16px', color: '#cbd5e1',
  });
  const stats = scene.add.text(690, 118, '', {
    fontFamily: 'monospace', fontSize: '17px', color: '#bae6fd', lineSpacing: 8,
    wordWrap: { width: 235 },
  });

  return {
    root: stats,
    update(model) {
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
      stats.destroy();
      help.destroy();
      title.destroy();
    },
  };
}
