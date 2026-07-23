import Phaser from 'phaser';
import { addMenuBackdrop, addMenuButton, applyTextScale, recoveryMessage } from '../presentation/menu-presentation.js';
import { campaign } from '../state/campaign.js';
import { campaignSaves } from '../state/runtime.js';
import { createMenuGamepad } from '../input/menu-gamepad.js';
import { CAMPAIGN_SAVE_SLOTS, CAMPAIGN_SAVE_VERSION, saveSlotLabel } from '../state/saves.js';

export class PauseScene extends Phaser.Scene {
  constructor() { super({ key: 'pause' }); }

  create() {
    addMenuBackdrop(this, 'Expedition paused', 'Save, inspect the journal, adjust settings, or return to the field.');
    addMenuButton(this, 82, 170, 'Resume · Esc', () => this.resume());
    this.slotIndex = 0;
    this.slotButton = addMenuButton(this, 82, 225, '', () => this.cycleSlot());
    addMenuButton(this, 270, 225, 'Save slot', () => this.save());
    addMenuButton(this, 430, 225, 'Load slot', () => this.load());
    addMenuButton(this, 82, 280, 'Quest journal · J', () => this.openOverlay('journal'));
    addMenuButton(this, 330, 280, 'Settings', () => this.openOverlay('settings'));
    addMenuButton(this, 82, 335, 'Restart expedition', () => this.restart());
    addMenuButton(this, 330, 335, 'Return to title', () => this.toTitle());
    this.status = this.add.text(82, 405, '', {
      fontFamily: 'monospace', fontSize: '14px', color: '#a7f3d0',
      wordWrap: { width: 760 }, lineSpacing: 4,
    });
    this.input.keyboard.on('keydown-ESC', this.resume, this);
    this.input.keyboard.on('keydown-J', () => this.openOverlay('journal'));
    this.menuGamepad = createMenuGamepad();
    this.renderSlot();
    applyTextScale(this, campaign.snapshot().settings.textScale);
  }

  update() {
    const pad = this.menuGamepad.read(this.input.gamepad?.getPad(0));
    if (pad.cancel || pad.confirm) this.resume();
    else if (pad.save) this.save();
    else if (pad.journal) this.openOverlay('journal');
  }

  openOverlay(key) {
    this.scene.pause();
    this.scene.launch(key, { returnTo: 'pause' });
  }

  resume() {
    this.scene.wake('world');
    this.scene.stop();
  }

  save() {
    campaignSaves.save(this.currentSlot());
    this.status.setText(`Saved version ${CAMPAIGN_SAVE_VERSION} campaign data to ${saveSlotLabel(this.currentSlot())}.`);
  }

  load() {
    const result = campaignSaves.load(this.currentSlot());
    this.status.setText(recoveryMessage(result));
    if (!result.ok) return;
    this.scene.stop('world');
    this.scene.start('world');
    this.scene.stop();
  }

  currentSlot() { return CAMPAIGN_SAVE_SLOTS[this.slotIndex]; }

  cycleSlot() {
    this.slotIndex = (this.slotIndex + 1) % CAMPAIGN_SAVE_SLOTS.length;
    this.renderSlot();
  }

  renderSlot() {
    const slot = this.currentSlot();
    this.slotButton.setText(`${saveSlotLabel(slot)} · change`);
    this.status?.setText(campaignSaves.has(slot) ? `${saveSlotLabel(slot)} contains a save.` : `${saveSlotLabel(slot)} is empty.`);
  }

  restart() {
    campaign.reset();
    this.scene.stop('world');
    this.scene.start('world');
    this.scene.stop();
  }

  toTitle() {
    this.scene.stop('world');
    this.scene.start('title');
    this.scene.stop();
  }
}
