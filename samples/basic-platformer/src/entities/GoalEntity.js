import { Entity } from '@phaser-game-engines/toolkit/platformer';

export class GoalEntity extends Entity {
  spawn(scene) {
    const view = scene.createPrefab('goal', { spec: this.spec });
    this.view = view;
    this.marker = view.body;
  }

  destroy() {
    this.view?.destroy();
  }
}
