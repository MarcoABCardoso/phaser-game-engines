export function addMenuBackdrop(scene, title, subtitle) {
  scene.cameras.main.setBackgroundColor('#080f1f');
  scene.add.rectangle(480, 270, 840, 460, 0x101a30, 0.98).setStrokeStyle(2, 0x64748b);
  scene.add.text(80, 68, title, {
    fontFamily: 'sans-serif', fontSize: '38px', color: '#ffffff', fontStyle: 'bold',
  });
  scene.add.text(82, 116, subtitle, {
    fontFamily: 'sans-serif', fontSize: '17px', color: '#bfdbfe', wordWrap: { width: 790 },
  });
}

export function addMenuButton(scene, x, y, label, action) {
  const button = scene.add.text(x, y, label, {
    fontFamily: 'sans-serif', fontSize: '20px', color: '#f8fafc',
    backgroundColor: '#24324b', padding: { x: 14, y: 9 },
  }).setInteractive({ useHandCursor: true });
  button.on('pointerover', () => button.setStyle({ backgroundColor: '#365175' }));
  button.on('pointerout', () => button.setStyle({ backgroundColor: '#24324b' }));
  button.on('pointerdown', action);
  return button;
}

export function recoveryMessage(result) {
  if (result.ok) return 'Save loaded.';
  if (result.reason === 'missing') return 'No save exists in this slot yet.';
  const raw = result.recovery?.raw ?? '';
  return `Save could not be loaded. Recovery data was preserved:\n${raw.slice(0, 180)}`;
}

export function applyTextScale(scene, scale = 1) {
  for (const child of scene.children.list) {
    // Keep interactive controls at their tested hit-target size; scale readable
    // content, headings, summaries, and status text around them.
    if (child.type === 'Text' && !child.input?.enabled) child.setScale(scale);
  }
}
