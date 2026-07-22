export function createCampaign() {
  let state;

  function reset() {
    state = { pendingEncounter: null, completedEncounters: {}, battlesCompleted: 0 };
    return snapshot();
  }

  function beginEncounter(encounter) {
    if (state.pendingEncounter || state.completedEncounters[encounter.id]) return null;
    state.pendingEncounter = structuredClone(encounter);
    return structuredClone(state.pendingEncounter);
  }

  function completeEncounter(outcome) {
    if (!state.pendingEncounter) throw new Error('Cannot complete an encounter when none is pending.');
    const id = state.pendingEncounter.id;
    state.completedEncounters[id] = structuredClone(outcome);
    state.pendingEncounter = null;
    state.battlesCompleted += 1;
    return snapshot();
  }

  function snapshot() {
    return structuredClone(state);
  }

  reset();
  return Object.freeze({ reset, beginEncounter, completeEncounter, snapshot });
}

export const campaign = createCampaign();
