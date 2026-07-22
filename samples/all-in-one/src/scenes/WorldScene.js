import { TopDownScene, createExplorationRecipe } from '@phaser-game-engines/toolkit/top-down';
import { world } from '../content/world.js';
import { BattleEncounterEntity } from '../entities/BattleEncounterEntity.js';
import { explorationControls } from '../input/controls.js';
import { campaign } from '../state/campaign.js';

export class WorldScene extends TopDownScene {
  constructor() {
    super({
      key: 'world',
      controls: explorationControls,
      recipes: [createExplorationRecipe({ statusText: 'Find the red encounter.' })],
      entityTypes: { 'battle-encounter': BattleEncounterEntity },
    });
    this.campaign = campaign;
  }

  getLevel() { return world; }

  onReady() {
    this.heading = this.add.text(16, 48, 'Top-down world', {
      fontFamily: 'sans-serif', fontSize: '24px', color: '#ffffff',
    }).setScrollFactor(0).setDepth(100);
  }

  requestEncounter(entity) {
    const encounter = this.campaign.beginEncounter({
      id: entity.id,
      label: entity.spec.label,
      battleSpec: {
        playerResolve: entity.spec.playerResolve,
        rivalResolve: entity.spec.rivalResolve,
      },
    });
    if (!encounter) return;
    this.player.body.setVelocity(0, 0);
    this.scene.launch('encounter', { encounter });
    this.scene.sleep();
  }

  onTick() {
    const completed = this.campaign.snapshot().completedEncounters;
    for (const id of Object.keys(completed)) this.entities.despawn(this, id);
    if (Object.keys(completed).length) this.prompt.setText('Encounter complete. World state survived the transition.');
  }
}
