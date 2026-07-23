import {
  createLocalStorageAdapter,
  createSaveStore,
  createSnapshotCodec,
} from '@phaser-game-engines/toolkit/core';
import { createFieldTrialState } from '../rules/field-trial.js';
import { createProgressionState } from '../rules/progression.js';

export const CAMPAIGN_SAVE_VERSION = 3;
export const DEFAULT_SAVE_SLOT = 'expedition';
export const CAMPAIGN_SAVE_SLOTS = Object.freeze([
  DEFAULT_SAVE_SLOT,
  'expedition-2',
  'expedition-3',
]);

export function saveSlotLabel(slot) {
  return `Slot ${CAMPAIGN_SAVE_SLOTS.indexOf(slot) + 1}`;
}

export function migrateCampaignV1(data) {
  return {
    ...structuredClone(data),
    fieldTrial: data.fieldTrial ?? createFieldTrialState(),
    strategistChoice: null,
    progression: createProgressionState(),
    credits: 0,
    rewards: {},
    settings: { reducedMotion: true, textScale: 1, audio: true },
    world: data.world ?? { areaId: 'camp', entryId: 'start', areas: {} },
  };
}

export function migrateCampaignV2(data) {
  return {
    ...structuredClone(data),
    settings: {
      ...(data.settings ?? {}),
      // Version 2 accidentally made the accessibility override the default.
      // Restore full motion once; players can opt back in from Settings.
      reducedMotion: false,
    },
  };
}

export function createCampaignSaveService(campaign, {
  storage = createLocalStorageAdapter(),
  prefix = 'pge:all-in-one:',
} = {}) {
  const codec = createSnapshotCodec({
    version: CAMPAIGN_SAVE_VERSION,
    capture: (source) => source.snapshot(),
    restore: (data, target) => target.restore(data),
    migrations: { 1: migrateCampaignV1, 2: migrateCampaignV2 },
  });
  const store = createSaveStore({ storage, prefix, codec });
  return Object.freeze({
    save(slot = DEFAULT_SAVE_SLOT) { return store.save(slot, campaign); },
    load(slot = DEFAULT_SAVE_SLOT) { return store.load(slot, campaign); },
    remove(slot = DEFAULT_SAVE_SLOT) { return store.remove(slot); },
    has(slot = DEFAULT_SAVE_SLOT) { return store.slots().includes(slot); },
    slots: store.slots,
  });
}
