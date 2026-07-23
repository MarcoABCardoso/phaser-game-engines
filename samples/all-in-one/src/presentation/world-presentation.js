export function createWorldHud({ scene, model }) {
  return scene.add.text(16, 48, model.heading, {
    fontFamily: 'sans-serif', fontSize: '24px', color: '#ffffff',
  }).setScrollFactor(0).setDepth(100);
}
