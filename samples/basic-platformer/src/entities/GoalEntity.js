import { Entity } from '@phaser-game-engines/toolkit/platformer';

export class GoalEntity extends Entity {
  spawn(scene) {
    this.marker = scene.add.star(this.spec.x, this.spec.y, 6, 12, 28, 0xffd166).setDepth(5);
  }

  destroy() {
    this.marker?.destroy();
  }
}
