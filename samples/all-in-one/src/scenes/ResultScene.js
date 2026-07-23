import Phaser from 'phaser';
import { addMenuBackdrop, addMenuButton, applyTextScale } from '../presentation/menu-presentation.js';
import { campaign } from '../state/campaign.js';
import { campaignSaves } from '../state/runtime.js';
import { audioDirector } from '../presentation/audio-director.js';
import { createMenuGamepad } from '../input/menu-gamepad.js';

export class ResultScene extends Phaser.Scene {
  constructor() { super({ key: 'result' }); }

  create() {
    audioDirector.transition('result', { enabled: campaign.snapshot().settings.audio });
    const state = campaign.snapshot();
    addMenuBackdrop(this, 'Field trial complete', 'The exploration, choice, inventory, battle, reward, and persistence loop is complete.');
    this.add.text(82, 180, [
      `Level ${state.progression.level}`,
      `Max HP ${state.player.maxHp} · Base attack ${state.player.attack}`,
      `Reward: ${state.rewards.fieldTrial.credits} credits and Field badge`,
      `Unspent skill points: ${state.progression.skillPoints}`,
    ], {
      fontFamily: 'sans-serif', fontSize: '21px', color: '#ddd6fe', lineSpacing: 10,
    });
    addMenuButton(this, 82, 340, 'Save and continue exploring', () => this.continue());
    addMenuButton(this, 405, 340, 'Restart expedition', () => this.restart());
    this.input.keyboard.on('keydown-ENTER', () => this.continue());
    this.menuGamepad = createMenuGamepad();
    applyTextScale(this, state.settings.textScale);
  }

  update() {
    const pad = this.menuGamepad.read(this.input.gamepad?.getPad(0));
    if (pad.confirm) this.continue();
    else if (pad.cancel) this.restart();
  }

  continue() {
    campaignSaves.save();
    const areaId = campaign.snapshot().world.areaId;
    audioDirector.transition(areaId, { enabled: campaign.snapshot().settings.audio });
    this.scene.wake('world');
    this.scene.stop();
  }

  restart() {
    campaign.reset();
    this.scene.stop('world');
    this.scene.start('world');
    this.scene.stop();
  }
}
