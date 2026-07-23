import Phaser from 'phaser';
import { addMenuBackdrop, addMenuButton, applyTextScale } from '../presentation/menu-presentation.js';
import { campaign } from '../state/campaign.js';
import { createMenuGamepad } from '../input/menu-gamepad.js';

export class JournalScene extends Phaser.Scene {
  constructor() { super({ key: 'journal' }); }

  init(data = {}) { this.returnTo = data.returnTo ?? null; }

  create() {
    const state = campaign.snapshot();
    const quest = campaign.questView();
    addMenuBackdrop(this, 'Quest journal', 'Campaign-owned objectives remain readable across areas, menus, saves, and battles.');
    this.add.text(82, 170, [quest.label, ...quest.lines, '', ...campaign.statusView(),
      `Battles: ${state.battlesCompleted} won / ${state.battlesAttempted} attempted`], {
      fontFamily: 'sans-serif', fontSize: '20px', color: '#e0e7ff',
      lineSpacing: 9, wordWrap: { width: 760 },
    });
    addMenuButton(this, 82, 410, 'Close journal · Esc', () => this.close());
    this.input.keyboard.on('keydown-ESC', () => this.close());
    this.input.keyboard.on('keydown-J', () => this.close());
    this.menuGamepad = createMenuGamepad();
    applyTextScale(this, state.settings.textScale);
  }

  update() {
    const pad = this.menuGamepad.read(this.input.gamepad?.getPad(0));
    if (pad.cancel || pad.confirm) this.close();
  }

  close() {
    if (this.returnTo) this.scene.resume(this.returnTo);
    this.scene.stop();
  }
}
