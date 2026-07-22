import { Inventory } from '@phaser-game-engines/toolkit/inventory/headless';

export function createCampaign() {
  let state;
  let inventory;

  function reset() {
    state = {
      pendingEncounter: null,
      completedEncounters: {},
      collected: {},
      battlesCompleted: 0,
      battlesAttempted: 0,
      lastBattle: null,
      player: { hp: 8, maxHp: 12, attack: 3, defense: 1 },
    };
    inventory = new Inventory({ itemSlots: 8, equipmentSlots: ['weapon', 'charm'] }, {
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
    }
    state.pendingEncounter = null;
    state.battlesAttempted += 1;
    return snapshot();
  }

  function snapshot() {
    return structuredClone({ ...state, inventory: inventory.snapshot() });
  }

  function collect(id, item) {
    if (state.collected[id]) return false;
    const location = inventory.add(item);
    if (!location) return false;
    state.collected[id] = true;
    return location;
  }

  function hasCollected(id) { return Boolean(state.collected[id]); }
  function sortInventory() { inventory.sort((a, b) => a.label.localeCompare(b.label)); }
  function playerStats() {
    const equipment = inventory.snapshot().equipment;
    return {
      attack: state.player.attack + (equipment.weapon?.attackBonus ?? 0),
      defense: state.player.defense + (equipment.charm?.defenseBonus ?? 0),
    };
  }

  reset();
  return Object.freeze({
    reset, beginEncounter, completeEncounter, snapshot, collect, hasCollected, sortInventory, playerStats,
    get inventory() { return inventory; },
  });
}

export const campaign = createCampaign();
