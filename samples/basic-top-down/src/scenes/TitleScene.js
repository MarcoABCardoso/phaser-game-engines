import Phaser from 'phaser';
import { addHeading, addHelp } from '../presentation/screen-presentation.js';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('title');
  }

  create() {
    addHeading(this, 'Signal Run');
    addHelp(this, 'Reach the signal. Learn the controls below, then start.');
    this.input.keyboard?.once('keydown-ENTER', () => this.scene.start('play'));
    this.input.once('pointerdown', () => this.scene.start('play'));
  }
  update() {
    if (this.input.gamepad?.getPad(0)?.buttons?.[0]?.pressed) this.scene.start('play');
  }
}
