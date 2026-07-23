import { Inventory } from '@phaser-game-engines/toolkit/inventory/headless';
import { createItem } from '../content/items.js';
import {
  completeFieldTrial,
  createFieldTrialState,
  fieldTrialDefinition,
  fieldTrialView,
  recordFieldTrialItem,
  resolveGuideInteraction,
} from '../rules/field-trial.js';
import { createProgressionState, grantFieldTrialReward } from '../rules/progression.js';
import { chooseStrategy, strategistConversation, strategyBonuses } from '../rules/strategist.js';

export function createCampaign() {
  let state;
  let inventory;

  function createInventory(saved = {}) {
    return new Inventory({
      itemSlots: 8,
      equipmentSlots: ['weapon', 'charm'],
      items: saved.items,
      equipment: saved.equipment,
    }, {
      rules: {
        canEquip: (item, slot) => item.tags?.includes(`equip:${slot}`),
        canUse: (item) => item.tags?.includes('usable'),
        useItem: (item) => {
          if (!item.restore || state.player.hp >= state.player.maxHp) return false;
          state.player.hp = Math.min(state.player.maxHp, state.player.hp + item.restore);
          return { consume: true };
        },
      },
    });
  }

  function reset() {
    state = {
      pendingEncounter: null,
      completedEncounters: {},
      collected: {},
      battlesCompleted: 0,
      battlesAttempted: 0,
      lastBattle: null,
      fieldTrial: createFieldTrialState(),
      strategistChoice: null,
      progression: createProgressionState(),
      credits: 0,
      rewards: {},
      settings: { reducedMotion: false, textScale: 1, audio: true },
      world: {
        areaId: 'camp',
        entryId: 'start',
        areas: {},
      },
      player: { hp: 8, maxHp: 12, attack: 3, defense: 1 },
    };
    inventory = createInventory();
    return snapshot();
  }

  function restore(saved) {
    if (!saved || typeof saved !== 'object' || !saved.player || !saved.inventory) {
      throw new TypeError('Campaign save must contain player and inventory state.');
    }
    const defaults = reset();
    state = {
      ...state,
      ...structuredClone(saved),
      world: {
        ...defaults.world,
        ...(saved.world ?? {}),
        areas: structuredClone(saved.world?.areas ?? {}),
      },
      fieldTrial: { ...defaults.fieldTrial, ...(saved.fieldTrial ?? {}) },
      progression: { ...defaults.progression, ...(saved.progression ?? {}) },
      rewards: structuredClone(saved.rewards ?? {}),
      settings: { ...defaults.settings, ...(saved.settings ?? {}) },
    };
    delete state.inventory;
    inventory = createInventory(saved.inventory);
    return snapshot();
  }

  function beginEncounter(encounter) {
    if (state.pendingEncounter || state.completedEncounters[encounter.id]) return null;
    const stats = playerStats();
    state.lastBattle = null;
    state.pendingEncounter = structuredClone({
      ...encounter,
      battleSpec: {
        ...encounter.battleSpec,
        player: {
          hp: state.player.hp,
          maxHp: state.player.maxHp,
          attack: stats.attack,
          defense: stats.defense,
        },
      },
    });
    return structuredClone(state.pendingEncounter);
  }

  function completeEncounter(outcome) {
    if (!state.pendingEncounter) throw new Error('Cannot complete an encounter when none is pending.');
    const id = state.pendingEncounter.id;
    state.lastBattle = structuredClone(outcome);
    if (outcome.kind === 'won') {
      state.player.hp = outcome.playerHp;
      state.completedEncounters[id] = structuredClone(outcome);
      state.battlesCompleted += 1;
      if (id === fieldTrialDefinition.encounterId) {
        state.fieldTrial = completeFieldTrial(state.fieldTrial);
        const reward = grantFieldTrialReward(state.player, state.progression);
        state.player = reward.player;
        state.progression = reward.progression;
        state.credits += reward.credits;
        if (!state.rewards.fieldTrial) {
          inventory.add(createItem('badge', 'field-trial-badge'));
          state.rewards.fieldTrial = { credits: reward.credits, item: 'field-trial-badge' };
        }
      }
    }
    state.pendingEncounter = null;
    state.battlesAttempted += 1;
    return snapshot();
  }

  function snapshot() {
    return structuredClone({ ...state, inventory: inventory.snapshot() });
  }

  function collect(id, item, { areaId = state.world.areaId } = {}) {
    if (state.collected[id]) return false;
    const location = inventory.add(item);
    if (!location) return false;
    state.collected[id] = true;
    setAreaEntityState(areaId, id, { collected: true });
    state.fieldTrial = recordFieldTrialItem(state.fieldTrial, item);
    return location;
  }

  function hasCollected(id, areaId = state.world.areaId) {
    return Boolean(state.world.areas[areaId]?.entities?.[id]?.collected ?? state.collected[id]);
  }
  function sortInventory() { inventory.sort((a, b) => a.label.localeCompare(b.label)); }
  function playerStats() {
    const equipment = inventory.snapshot().equipment;
    const strategy = strategyBonuses(state.strategistChoice);
    return {
      attack: state.player.attack + strategy.attack + (equipment.weapon?.attackBonus ?? 0),
      defense: state.player.defense + strategy.defense + (equipment.charm?.defenseBonus ?? 0),
    };
  }

  function talkToGuide() {
    const result = resolveGuideInteraction(state.fieldTrial);
    state.fieldTrial = result.trial;
    return structuredClone(result.lines);
  }

  function canStartEncounter(id) {
    return id !== fieldTrialDefinition.encounterId || state.fieldTrial.status === 'authorized';
  }

  function questView() { return fieldTrialView(state.fieldTrial); }

  function talkToStrategist() { return structuredClone(strategistConversation(state.strategistChoice)); }

  function chooseStrategistPath(choice) {
    state.strategistChoice = chooseStrategy(state.strategistChoice, choice);
    return structuredClone(strategistConversation(state.strategistChoice));
  }

  function statusView() {
    const strategy = state.strategistChoice === 'power' ? 'Blade overcharge'
      : state.strategistChoice === 'guard' ? 'Shield stabilization' : 'Rig uncalibrated';
    return [
      `Level ${state.progression.level} · ${state.credits} credits`,
      strategy,
    ];
  }

  function updateSetting(name, value) {
    if (!Object.hasOwn(state.settings, name)) throw new Error(`Unknown campaign setting: ${name}`);
    state.settings[name] = value;
    return structuredClone(state.settings);
  }

  function enterArea(areaId, entryId) {
    state.world.areaId = areaId;
    state.world.entryId = entryId;
    state.world.areas[areaId] ??= { entities: {} };
    return structuredClone(state.world);
  }

  function setAreaEntityState(areaId, entityId, patch) {
    state.world.areas[areaId] ??= { entities: {} };
    const entities = state.world.areas[areaId].entities;
    entities[entityId] = { ...(entities[entityId] ?? {}), ...structuredClone(patch) };
    return structuredClone(entities[entityId]);
  }

  function areaEntityState(areaId, entityId) {
    return structuredClone(state.world.areas[areaId]?.entities?.[entityId] ?? null);
  }

  reset();
  return Object.freeze({
    reset, restore, beginEncounter, completeEncounter, snapshot, collect, hasCollected, sortInventory, playerStats,
    talkToGuide, canStartEncounter, questView,
    talkToStrategist, chooseStrategistPath, statusView,
    updateSetting,
    enterArea, setAreaEntityState, areaEntityState,
    get inventory() { return inventory; },
  });
}

export const campaign = createCampaign();
