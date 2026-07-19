import { lifecycleEvent } from '@phaser-game-engines/toolkit/core';

export function installSurveyHud(scene, specimenCount) {
  let progressText;

  const subscriptions = [
    scene.lifecycle.on(lifecycleEvent.ready, () => {
      progressText = scene.add.text(12, 510, '', {
        fontFamily: 'sans-serif',
        fontSize: '16px',
        color: '#dff7c6',
        backgroundColor: '#14261ecc',
        padding: { x: 7, y: 4 },
      }).setScrollFactor(0).setDepth(100);
    }),
    scene.lifecycle.on(lifecycleEvent.tick, () => {
      progressText?.setText(
        `Field notes: ${scene.observations.size}/${specimenCount}`,
      );
    }),
  ];

  scene.lifecycle.once(lifecycleEvent.shutdown, () => {
    for (const unsubscribe of subscriptions) unsubscribe();
  });
}
