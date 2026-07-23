import { Entity } from '@phaser-game-engines/toolkit/top-down';

export class GoalEntity extends Entity {
  spawn(scene) {
    const view = scene.createPrefab('goal', { spec: this.spec });
    this.view = view;
    this.marker = view.body;
    scene.physics.add.existing(this.marker, true);
    this.overlap = scene.physics.add.overlap(
      scene.player,
      this.marker,
      () => scene.onGoalContact?.(this),
    );
  }

  destroy() {
    this.view?.destroy();
    this.overlap?.destroy();
  }
}
