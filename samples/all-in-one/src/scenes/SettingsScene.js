import Phaser from 'phaser';
import { addMenuBackdrop, addMenuButton, applyTextScale } from '../presentation/menu-presentation.js';
import { campaign } from '../state/campaign.js';
import { audioDirector } from '../presentation/audio-director.js';
import { createMenuGamepad } from '../input/menu-gamepad.js';

export class SettingsScene extends Phaser.Scene {
  constructor() { super({ key: 'settings' }); }

  init(data = {}) { this.returnTo = data.returnTo ?? null; }

  create() {
    addMenuBackdrop(this, 'Settings', 'These game-owned preferences are serialized with the campaign.');
    this.summary = this.add.text(82, 175, '', {
      fontFamily: 'sans-serif', fontSize: '20px', color: '#e0f2fe', lineSpacing: 8,
    });
    addMenuButton(this, 82, 280, 'Toggle reduced motion', () => this.toggle('reducedMotion'));
    addMenuButton(this, 350, 280, 'Change text scale', () => this.cycleTextScale());
    addMenuButton(this, 82, 340, 'Toggle audio', () => this.toggle('audio'));
    addMenuButton(this, 82, 410, 'Close settings · Esc', () => this.close());
    this.input.keyboard.on('keydown-ESC', () => this.close());
    this.menuGamepad = createMenuGamepad();
    this.render();
    applyTextScale(this, campaign.snapshot().settings.textScale);
  }

  update() {
    const pad = this.menuGamepad.read(this.input.gamepad?.getPad(0));
    if (pad.cancel) this.close();
    else if (pad.confirm) this.toggle('reducedMotion');
    else if (pad.journal) this.cycleTextScale();
    else if (pad.save) this.toggle('audio');
  }

  close() {
    if (this.returnTo) this.scene.resume(this.returnTo);
    this.scene.stop();
  }

  toggle(name) {
    const settings = campaign.snapshot().settings;
    campaign.updateSetting(name, !settings[name]);
    if (name === 'audio') {
      const next = campaign.snapshot().settings.audio;
      audioDirector.transition(next ? campaign.snapshot().world.areaId : null, { enabled: next });
    }
    this.render();
  }

  cycleTextScale() {
    const current = campaign.snapshot().settings.textScale;
    campaign.updateSetting('textScale', current >= 1.25 ? 1 : current + 0.25);
    this.render();
    applyTextScale(this, campaign.snapshot().settings.textScale);
  }

  render() {
    const settings = campaign.snapshot().settings;
    this.summary.setText([
      `Reduced motion: ${settings.reducedMotion ? 'on' : 'off'}`,
      `Text scale: ${settings.textScale.toFixed(2)}×`,
      `Audio: ${settings.audio ? 'on' : 'off'}`,
    ]);
  }
}
