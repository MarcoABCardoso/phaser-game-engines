import { createMemoryStorage } from '@phaser-game-engines/toolkit/core';
import { Battle } from '@phaser-game-engines/toolkit/battle/headless';
import { expect, test } from 'vitest';
import { getEncounter } from '../content/areas.js';
import { createItem } from '../content/items.js';
import { battleRules } from '../rules/battle-rules.js';
import { createCampaign } from '../state/campaign.js';
import { createCampaignSaveService } from '../state/saves.js';

function completePresentation(battle) {
  if (battle.state.machine.phase === 'presentation') battle.completeEffect();
}

test('the complete RPG slice survives exploration, choice, battle, reward, save, and reload', () => {
  const campaign = createCampaign();
  campaign.talkToGuide();
  campaign.collect('field-tonic', createItem('tonic', 'field-tonic'), { areaId: 'camp' });
  campaign.collect('rusty-sword', createItem('sword', 'rusty-sword'), { areaId: 'camp' });
  campaign.enterArea('grove', 'from-camp');
  campaign.chooseStrategistPath('guard');
  campaign.collect('sky-charm', createItem('charm', 'sky-charm'), { areaId: 'grove' });
  campaign.enterArea('camp', 'from-grove');
  campaign.talkToGuide();
  expect(campaign.canStartEncounter('training-drone')).toBe(true);

  campaign.inventory.move({ kind: 'item', index: 1 }, { kind: 'equipment', slot: 'weapon' });
  campaign.inventory.move({ kind: 'item', index: 2 }, { kind: 'equipment', slot: 'charm' });
  campaign.inventory.use({ kind: 'item', index: 0 });
  expect(campaign.playerStats()).toEqual({ attack: 5, defense: 4 });

  campaign.enterArea('grove', 'from-camp');
  const encounter = getEncounter('training-drone');
  const handoff = campaign.beginEncounter({
    id: 'training-drone',
    label: encounter.label,
    battleSpec: { enemies: encounter.enemies },
  });
  const battle = new Battle(handoff.battleSpec, { rules: battleRules, rng: () => 0 });
  battle.start();
  let playerTurns = 0;
  while (!battle.state.machine.outcome) {
    const actorId = battle.state.machine.activeId;
    const id = actorId === 'player' && playerTurns % 2 === 1 ? 'guard' : 'attack';
    const targetId = actorId === 'player'
      ? Object.values(battle.state.game.enemies).find((enemy) => enemy.hp > 0).id
      : 'player';
    battle.submitCommand({ id, actorId, ...(id === 'attack' ? { targetId } : {}) });
    completePresentation(battle);
    if (actorId === 'player') playerTurns += 1;
  }
  expect(battle.state.machine.outcome.kind).toBe('won');
  campaign.completeEncounter(battle.state.machine.outcome);
  expect(campaign.snapshot()).toMatchObject({
    fieldTrial: { status: 'complete' },
    progression: { level: 2, skillPoints: 1 },
    strategistChoice: 'guard',
    credits: 25,
  });

  const storage = createMemoryStorage();
  const saves = createCampaignSaveService(campaign, { storage });
  saves.save();
  campaign.reset();
  expect(saves.load().ok).toBe(true);
  expect(campaign.snapshot()).toMatchObject({
    world: { areaId: 'grove', entryId: 'from-camp' },
    fieldTrial: { status: 'complete' },
    progression: { level: 2 },
    settings: { reducedMotion: false, textScale: 1, audio: true },
  });
});
