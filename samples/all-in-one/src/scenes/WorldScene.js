import { TopDownScene, createExplorationRecipe } from '@phaser-game-engines/toolkit/top-down';
import { convertTiledMap } from '@phaser-game-engines/toolkit/content/tiled';
import { areas, getArea, getEncounter, resolveAreaEntry } from '../content/areas.js';
import { AreaPortalEntity } from '../entities/AreaPortalEntity.js';
import { BattleEncounterEntity } from '../entities/BattleEncounterEntity.js';
import { CollectibleEntity } from '../entities/CollectibleEntity.js';
import { GuideEntity } from '../entities/GuideEntity.js';
import { StrategistEntity } from '../entities/StrategistEntity.js';
import Phaser from 'phaser';
import { explorationControls } from '../input/controls.js';
import { gateDialogueInput } from '../input/dialogue-input.js';
import { createMenuGamepad } from '../input/menu-gamepad.js';
import { createWorldDialogue, createWorldHud } from '../presentation/world-presentation.js';
import { audioDirector } from '../presentation/audio-director.js';
import { campaign } from '../state/campaign.js';

export class WorldScene extends TopDownScene {
  constructor() {
    super({
      key: 'world',
      controls: explorationControls,
      recipes: [createExplorationRecipe({ statusText: 'Follow the quest tracker. Interact with E and open inventory with I.' })],
      entityTypes: {
        'area-portal': AreaPortalEntity,
        'battle-encounter': BattleEncounterEntity,
        collectible: CollectibleEntity,
        guide: GuideEntity,
        strategist: StrategistEntity,
      },
      presentation: { presenters: { 'world.hud': createWorldHud, 'world.dialogue': createWorldDialogue } },
    });
    this.campaign = campaign;
  }

  init(data = {}) {
    const current = this.campaign.snapshot().world;
    this.areaId = data.areaId ?? current.areaId;
    this.entryId = data.entryId ?? current.entryId;
    this.area = getArea(this.areaId);
  }

  preload() {
    for (const area of Object.values(areas)) this.load.tilemapTiledJSON(area.mapKey, area.mapUrl);
    this.load.svg('expedition-tiles', 'assets/expedition-tiles.svg', { width: 128, height: 32 });
  }

  getLevel() {
    const cached = this.cache.tilemap.get(this.area.mapKey);
    if (!cached?.data) throw new Error(`Tiled map ${this.area.mapKey} was not loaded.`);
    const level = convertTiledMap(cached.data, {
      kind: 'top-down',
      path: this.area.mapUrl,
      types: ['area-portal', 'battle-encounter', 'collectible', 'guide', 'strategist'],
    });
    level.spawn = resolveAreaEntry(this.areaId, this.entryId);
    return level;
  }

  getEncounter(id) { return getEncounter(id); }

  readInputIntent(time, delta) {
    const intent = explorationControls.read({ scene: this, time, delta });
    const gated = gateDialogueInput(intent, {
      dialogueOpen: Boolean(this.dialogue),
      waitingForInteractRelease: Boolean(this.dialogueInputBlockedUntilRelease),
    });
    this.dialogueInputBlockedUntilRelease = gated.waitingForInteractRelease;
    return gated.intent;
  }

  pgeOnReady() {
    audioDirector.transition(this.areaId, { enabled: this.campaign.snapshot().settings.audio });
    const map = this.make.tilemap({ key: this.area.mapKey });
    const tileset = map.addTilesetImage('expedition-tiles', 'expedition-tiles');
    this.groundLayer = map.createLayer('ground', tileset, 0, 0).setDepth(-10);
    this.worldHud = this.present('world.hud', {
      model: {
        heading: this.area.label,
        quest: this.campaign.questView(),
        status: this.campaign.statusView(),
        textScale: this.campaign.snapshot().settings.textScale,
      },
    });
    this.updateWorldHud();
    this.inventoryKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
    this.dialogueKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.choiceOneKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
    this.choiceTwoKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
    this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.menuGamepad = createMenuGamepad();
    this.dialogueKey.on('down', this.advanceDialogue, this);
    this.choiceOneKey.on('down', this.chooseFirstDialogueOption, this);
    this.choiceTwoKey.on('down', this.chooseSecondDialogueOption, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.dialogueKey.off('down', this.advanceDialogue, this);
      this.choiceOneKey.off('down', this.chooseFirstDialogueOption, this);
      this.choiceTwoKey.off('down', this.chooseSecondDialogueOption, this);
    });
  }

  requestEncounter(entity) {
    if (!this.campaign.canStartEncounter(entity.id)) {
      this.showMessage('Mira has not activated the trial. Complete her preparation objectives first.');
      return;
    }
    const definition = this.getEncounter(entity.spec.encounter);
    const encounter = this.campaign.beginEncounter({
      id: entity.id,
      label: definition.label,
      battleSpec: {
        enemies: definition.enemies,
      },
    });
    if (!encounter) return;
    this.player.body.setVelocity(0, 0);
    this.scene.launch('encounter', { encounter });
    this.scene.sleep();
  }

  enterNamedArea(areaId, entryId) {
    this.transitioning = true;
    this.campaign.enterArea(areaId, entryId);
    this.cameras.main.fadeOut(180, 9, 15, 31);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.restart({ areaId, entryId });
    });
  }

  talkToGuide() {
    this.openDialogue(this.campaign.talkToGuide());
  }

  talkToStrategist() {
    this.openDialogue(this.campaign.talkToStrategist(), {
      onChoice: (choice) => {
        audioDirector.cue('choice', { enabled: this.campaign.snapshot().settings.audio });
        this.openDialogue(this.campaign.chooseStrategistPath(choice));
      },
    });
  }

  openDialogue(lines, { onChoice = null } = {}) {
    const textScale = this.campaign.snapshot().settings.textScale;
    lines = lines.map((line) => ({ ...line, textScale }));
    this.dialogue?.handle.destroy();
    this.dialogue = { lines, index: 0, onChoice, handle: this.present('world.dialogue', { model: lines[0] }) };
    this.player.body.setVelocity(0, 0);
  }

  advanceDialogue() {
    if (!this.dialogue) return;
    if (this.dialogue.lines[this.dialogue.index].choices?.length) return;
    this.dialogue.index += 1;
    if (this.dialogue.index < this.dialogue.lines.length) {
      this.dialogue.handle.update(this.dialogue.lines[this.dialogue.index]);
      return;
    }
    this.dialogue.handle.destroy();
    this.dialogue = null;
    // The keydown that closed the dialogue is still visible to the normalized
    // input adapter during this frame. Wait for keyup before interactions resume.
    this.dialogueInputBlockedUntilRelease = true;
  }

  chooseFirstDialogueOption() { this.chooseDialogueOption(0); }
  chooseSecondDialogueOption() { this.chooseDialogueOption(1); }

  chooseDialogueOption(index) {
    const line = this.dialogue?.lines[this.dialogue.index];
    const choice = line?.choices?.[index];
    if (!choice || !this.dialogue.onChoice) return;
    this.dialogue.onChoice(choice.id);
  }

  performContextAction() {
    if (this.dialogue) {
      const line = this.dialogue.lines[this.dialogue.index];
      if (line.choices?.length) this.chooseDialogueOption(0);
      else this.advanceDialogue();
      return;
    }
    this.currentContextualAction?.execute?.();
  }

  pgeOnTick() {
    this.updateWorldHud();
    const pad = this.menuGamepad.read(this.input.gamepad?.getPad(0));
    if (this.dialogue) {
      if (pad.cancel) this.chooseDialogueOption(1);
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(this.pauseKey) || pad.menu) {
      this.player.body.setVelocity(0, 0);
      this.scene.launch('pause');
      this.scene.sleep();
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(this.inventoryKey)) {
      this.player.body.setVelocity(0, 0);
      this.scene.launch('inventory');
      this.scene.sleep();
      return;
    }
    const campaignState = this.campaign.snapshot();
    const completed = campaignState.completedEncounters;
    for (const id of Object.keys(completed)) this.entities.despawn(this, id);
    if (Object.keys(completed).length) this.prompt.setText('Field trial complete. Campaign and world state survived the encounter.');
    else if (campaignState.lastBattle?.kind === 'lost') {
      this.prompt.setText('Defeated. Collect the tonic and equipment, then use Attack and Guard.');
    }
  }

  updateWorldHud() {
    this.worldHud.update({
      heading: this.area.label,
      quest: this.campaign.questView(),
      status: this.campaign.statusView(),
      textScale: this.campaign.snapshot().settings.textScale,
    });
  }
}
