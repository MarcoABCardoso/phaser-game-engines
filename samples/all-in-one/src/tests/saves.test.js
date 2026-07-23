import { createMemoryStorage } from '@phaser-game-engines/toolkit/core';
import { expect, test } from 'vitest';
import { createItem } from '../content/items.js';
import { createCampaign } from '../state/campaign.js';
import {
  CAMPAIGN_SAVE_VERSION,
  CAMPAIGN_SAVE_SLOTS,
  createCampaignSaveService,
  migrateCampaignV1,
  migrateCampaignV2,
} from '../state/saves.js';

test('save slots restore area, inventory, quest, choice, and progression state', () => {
  const storage = createMemoryStorage();
  const campaign = createCampaign();
  const saves = createCampaignSaveService(campaign, { storage });
  campaign.enterArea('grove', 'from-camp');
  campaign.collect('sword', createItem('sword', 'sword'), { areaId: 'camp' });
  campaign.chooseStrategistPath('guard');
  saves.save();

  campaign.reset();
  expect(campaign.snapshot().world.areaId).toBe('camp');
  const loaded = saves.load();
  expect(loaded.ok).toBe(true);
  expect(campaign.snapshot()).toMatchObject({
    world: { areaId: 'grove', entryId: 'from-camp' },
    strategistChoice: 'guard',
  });
  expect(campaign.hasCollected('sword', 'camp')).toBe(true);
});

test('version-1 campaign data migrates through every version-3 field', () => {
  const legacy = {
    player: { hp: 8, maxHp: 12, attack: 3, defense: 1 },
    inventory: { items: [], equipment: {} },
  };
  const migrated = migrateCampaignV2(migrateCampaignV1(legacy));
  expect(migrated).toMatchObject({
    strategistChoice: null,
    progression: { level: 1 },
    world: { areaId: 'camp', entryId: 'start' },
    settings: { reducedMotion: false },
  });

  const storage = createMemoryStorage({
    'pge:all-in-one:expedition': JSON.stringify({ version: 1, data: legacy }),
  });
  const campaign = createCampaign();
  const loaded = createCampaignSaveService(campaign, { storage }).load();
  expect(loaded.ok).toBe(true);
  expect(CAMPAIGN_SAVE_VERSION).toBe(3);
});

test('version-2 saves recover full motion after the accidental reduced-motion default', () => {
  const campaign = createCampaign();
  const versionTwo = campaign.snapshot();
  versionTwo.settings.reducedMotion = true;
  const storage = createMemoryStorage({
    'pge:all-in-one:expedition': JSON.stringify({ version: 2, data: versionTwo }),
  });

  const loadedCampaign = createCampaign();
  expect(createCampaignSaveService(loadedCampaign, { storage }).load().ok).toBe(true);
  expect(loadedCampaign.snapshot().settings.reducedMotion).toBe(false);
});

test('invalid save JSON is preserved as recovery data', () => {
  const storage = createMemoryStorage({ 'pge:all-in-one:expedition': '{broken' });
  const saves = createCampaignSaveService(createCampaign(), { storage });
  const loaded = saves.load();
  expect(loaded).toMatchObject({
    ok: false,
    reason: 'invalid-or-unmigratable',
    recovery: { raw: '{broken' },
  });
});

test('three named UI slots remain independent', () => {
  const storage = createMemoryStorage();
  const campaign = createCampaign();
  const saves = createCampaignSaveService(campaign, { storage });
  saves.save(CAMPAIGN_SAVE_SLOTS[0]);
  campaign.enterArea('grove', 'from-camp');
  saves.save(CAMPAIGN_SAVE_SLOTS[1]);

  campaign.reset();
  saves.load(CAMPAIGN_SAVE_SLOTS[1]);
  expect(campaign.snapshot().world.areaId).toBe('grove');
  expect(saves.has(CAMPAIGN_SAVE_SLOTS[2])).toBe(false);
});
