import { expect, test } from 'vitest';
import { createCampaign } from '../state/campaign.js';
import { createItem } from '../content/items.js';

test('campaign owns the stat-aware encounter handoff between scenes', () => {
  const campaign = createCampaign();
  const encounter = campaign.beginEncounter({
    id: 'drone',
    battleSpec: { enemies: [{ id: 'alpha', hp: 6, maxHp: 6, attack: 4, defense: 2 }] },
  });
  expect(encounter.id).toBe('drone');
  expect(encounter.battleSpec.player).toEqual({ hp: 8, maxHp: 12, attack: 3, defense: 1 });
  expect(campaign.beginEncounter({ id: 'other' })).toBeNull();

  const completed = campaign.completeEncounter({ kind: 'won', playerHp: 5 });
  expect(completed.pendingEncounter).toBeNull();
  expect(completed.player.hp).toBe(5);
  expect(completed.completedEncounters.drone).toEqual({ kind: 'won', playerHp: 5 });
  expect(campaign.beginEncounter({ id: 'drone' })).toBeNull();
});

test('exploration collectibles enter the persistent inventory', () => {
  const campaign = createCampaign();
  expect(campaign.collect('sword-1', createItem('sword', 'sword-1'))).toEqual({ kind: 'item', index: 0 });
  expect(campaign.hasCollected('sword-1')).toBe(true);
  expect(campaign.collect('sword-1', createItem('sword', 'duplicate'))).toBe(false);
  expect(campaign.inventory.move(
    { kind: 'item', index: 0 },
    { kind: 'equipment', slot: 'weapon' },
  )).toBe(true);
  expect(campaign.snapshot().inventory.equipment.weapon.kind).toBe('sword');
  expect(campaign.playerStats()).toEqual({ attack: 5, defense: 1 });
});

test('tonics restore HP and are consumed', () => {
  const campaign = createCampaign();
  campaign.collect('tonic-1', createItem('tonic', 'tonic-1'));
  expect(campaign.inventory.use({ kind: 'item', index: 0 })).toEqual({ consume: true });
  expect(campaign.snapshot().player.hp).toBe(12);
  expect(campaign.snapshot().inventory.items[0]).toBeNull();
});

test('a lost encounter can be retried after preparing', () => {
  const campaign = createCampaign();
  const spec = { id: 'drone', battleSpec: { enemies: [{ id: 'alpha', hp: 6, maxHp: 6, attack: 4, defense: 2 }] } };
  campaign.beginEncounter(spec);
  const afterLoss = campaign.completeEncounter({ kind: 'lost', playerHp: 0 });
  expect(afterLoss.completedEncounters).not.toHaveProperty('drone');
  expect(afterLoss.player.hp).toBe(8);
  expect(campaign.beginEncounter(spec)).not.toBeNull();
});

test('the field trial connects NPC dialogue, collection, encounter access, and completion', () => {
  const campaign = createCampaign();
  expect(campaign.canStartEncounter('training-drone')).toBe(false);
  expect(campaign.questView().lines).toEqual(['○ Talk to Mira by the camp']);

  expect(campaign.talkToGuide()[0].text).toContain('training drones');
  campaign.collect('sword-1', createItem('sword', 'sword-1'));
  expect(campaign.talkToGuide()[0].text).toContain('sky charm');
  campaign.collect('charm-1', createItem('charm', 'charm-1'));
  expect(campaign.questView().lines).toContain('○ Report back to Mira');
  expect(campaign.talkToGuide()[0].text).toContain('activated');
  expect(campaign.canStartEncounter('training-drone')).toBe(true);

  campaign.beginEncounter({ id: 'training-drone', battleSpec: { enemies: [] } });
  campaign.completeEncounter({ kind: 'won', playerHp: 7 });
  expect(campaign.snapshot().fieldTrial.status).toBe('complete');
  expect(campaign.questView().lines).toContain('Trial complete');
});

test('named area transitions and entity state persist independently per area', () => {
  const campaign = createCampaign();
  campaign.enterArea('grove', 'from-camp');
  campaign.collect('grove-tonic', createItem('tonic', 'grove-tonic'), { areaId: 'grove' });

  expect(campaign.snapshot().world).toMatchObject({ areaId: 'grove', entryId: 'from-camp' });
  expect(campaign.areaEntityState('grove', 'grove-tonic')).toEqual({ collected: true });
  expect(campaign.areaEntityState('camp', 'grove-tonic')).toBeNull();

  campaign.enterArea('camp', 'from-grove');
  expect(campaign.hasCollected('grove-tonic', 'grove')).toBe(true);
  expect(campaign.snapshot().world).toMatchObject({ areaId: 'camp', entryId: 'from-grove' });
});

test('a permanent strategist choice affects encounters and the field trial grants progression', () => {
  const campaign = createCampaign();
  expect(campaign.talkToStrategist()[1].choices).toHaveLength(2);
  campaign.chooseStrategistPath('power');
  expect(campaign.playerStats()).toEqual({ attack: 4, defense: 1 });
  expect(campaign.chooseStrategistPath('guard')[0].text).toContain('blade calibration');

  campaign.beginEncounter({ id: 'training-drone', battleSpec: { enemies: [] } });
  const completed = campaign.completeEncounter({ kind: 'won', playerHp: 3 });
  expect(completed).toMatchObject({
    player: { hp: 14, maxHp: 14, attack: 4 },
    progression: { level: 2, skillPoints: 1 },
    credits: 25,
    rewards: { fieldTrial: { credits: 25, item: 'field-trial-badge' } },
  });
  expect(completed.inventory.items.some((item) => item?.kind === 'badge')).toBe(true);
});
