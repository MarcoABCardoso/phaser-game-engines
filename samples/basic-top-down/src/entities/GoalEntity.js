import { Entity } from '@phaser-game-engines/toolkit/top-down';

export class GoalEntity extends Entity {
  spawn(scene) {
    this.marker = scene.add.star(this.spec.x, this.spec.y, 6, 12, 28, 0xffd166).setDepth(5);
    scene.physics.add.existing(this.marker, true);
    this.overlap = scene.physics.add.overlap(
      scene.player,
      this.marker,
      () => scene.onGoalContact?.(this),
    );
  }

  destroy() {
    this.marker?.destroy();
    this.overlap?.destroy();
  }
}
