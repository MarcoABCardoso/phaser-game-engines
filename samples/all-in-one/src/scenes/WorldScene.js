import { TopDownScene, createExplorationRecipe } from '@phaser-game-engines/toolkit/top-down';
import { world } from '../content/world.js';
import { BattleEncounterEntity } from '../entities/BattleEncounterEntity.js';
import { CollectibleEntity } from '../entities/CollectibleEntity.js';
import Phaser from 'phaser';
import { explorationControls } from '../input/controls.js';
import { campaign } from '../state/campaign.js';

export class WorldScene extends TopDownScene {
  constructor() {
    super({
      key: 'world',
      controls: explorationControls,
      recipes: [createExplorationRecipe({ statusText: 'Collect items, open inventory with I, or find the red encounter.' })],
      entityTypes: { 'battle-encounter': BattleEncounterEntity, collectible: CollectibleEntity },
    });
    this.campaign = campaign;
  }

  getLevel() { return world; }

  onReady() {
    this.heading = this.add.text(16, 48, 'Top-down world', {
      fontFamily: 'sans-serif', fontSize: '24px', color: '#ffffff',
    }).setScrollFactor(0).setDepth(100);
    this.inventoryKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
  }

  requestEncounter(entity) {
    const encounter = this.campaign.beginEncounter({
      id: entity.id,
      label: entity.spec.label,
      battleSpec: {
        enemies: entity.spec.enemies,
      },
    });
    if (!encounter) return;
    this.player.body.setVelocity(0, 0);
    this.scene.launch('encounter', { encounter });
    this.scene.sleep();
  }

  onTick() {
    if (Phaser.Input.Keyboard.JustDown(this.inventoryKey)) {
      this.player.body.setVelocity(0, 0);
      this.scene.launch('inventory');
      this.scene.sleep();
      return;
    }
    const campaignState = this.campaign.snapshot();
    const completed = campaignState.completedEncounters;
    for (const id of Object.keys(completed)) this.entities.despawn(this, id);
    if (Object.keys(completed).length) this.prompt.setText('Encounter complete. World state survived the transition.');
    else if (campaignState.lastBattle?.kind === 'lost') {
      this.prompt.setText('Defeated. Collect the tonic and equipment, then use Attack and Guard.');
    }
  }
}
