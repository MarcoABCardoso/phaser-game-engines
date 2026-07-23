import Phaser from 'phaser';
import { addMenuBackdrop, addMenuButton, applyTextScale, recoveryMessage } from '../presentation/menu-presentation.js';
import { campaign } from '../state/campaign.js';
import { campaignSaves } from '../state/runtime.js';
import { audioDirector } from '../presentation/audio-director.js';
import { createMenuGamepad } from '../input/menu-gamepad.js';
import { CAMPAIGN_SAVE_SLOTS, saveSlotLabel } from '../state/saves.js';

export class TitleScene extends Phaser.Scene {
  constructor() { super({ key: 'title' }); }

  create() {
    audioDirector.transition('title', { enabled: campaign.snapshot().settings.audio });
    addMenuBackdrop(
      this,
      'Signal Grove Expedition',
      'A compact RPG slice built from replaceable toolkit scenes, controllers, and game-owned rules.',
    );
    addMenuButton(this, 82, 175, 'Start new expedition · Enter', () => this.startNew());
    CAMPAIGN_SAVE_SLOTS.forEach((slot, index) => {
      const availability = campaignSaves.has(slot) ? 'continue' : 'empty';
      addMenuButton(this, 82, 230 + index * 54, `${saveSlotLabel(slot)} · ${availability}`, () => this.continueSaved(slot));
    });
    this.status = this.add.text(82, 410, 'Versioned saves migrate on load; unreadable data is preserved here for recovery.', {
      fontFamily: 'monospace', fontSize: '15px', color: '#cbd5e1',
      wordWrap: { width: 760 }, lineSpacing: 5,
    });
    this.input.keyboard.on('keydown-ENTER', this.startNew, this);
    this.input.keyboard.on('keydown-C', this.continueSaved, this);
    this.menuGamepad = createMenuGamepad();
    applyTextScale(this, campaign.snapshot().settings.textScale);
  }

  update() {
    const pad = this.menuGamepad.read(this.input.gamepad?.getPad(0));
    if (pad.confirm) this.startNew();
    else if (pad.journal) this.continueSaved();
  }

  startNew() {
    campaign.reset();
    this.scene.start('world');
  }

  continueSaved(slot = CAMPAIGN_SAVE_SLOTS.find((candidate) => campaignSaves.has(candidate))) {
    const result = campaignSaves.load(slot);
    if (result.ok) this.scene.start('world');
    else this.status.setText(recoveryMessage(result));
  }
}
