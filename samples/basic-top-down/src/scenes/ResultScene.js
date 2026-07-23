import Phaser from 'phaser';
import { addHeading, addHelp } from '../presentation/screen-presentation.js';

export class ResultScene extends Phaser.Scene {
  constructor() {
    super('result');
  }

  create(data) {
    addHeading(this, data.won === false ? 'Try again' : 'Signal reached!');
    addHelp(this, 'Press Enter, gamepad A, or tap to restart.');
    this.input.keyboard?.once('keydown-ENTER', () => this.scene.start('play'));
    this.input.once('pointerdown', () => this.scene.start('play'));
  }
  update() {
    if (this.input.gamepad?.getPad(0)?.buttons?.[0]?.pressed) this.scene.start('play');
  }
}
