import { expect, test } from 'vitest';
import { createCampaign } from '../state/campaign.js';

test('campaign owns the encounter handoff between scenes', () => {
  const campaign = createCampaign();
  const encounter = campaign.beginEncounter({ id: 'drone', battleSpec: { rivalResolve: 5 } });
  expect(encounter.id).toBe('drone');
  expect(campaign.beginEncounter({ id: 'other' })).toBeNull();

  const completed = campaign.completeEncounter({ kind: 'won' });
  expect(completed.pendingEncounter).toBeNull();
  expect(completed.completedEncounters.drone).toEqual({ kind: 'won' });
  expect(campaign.beginEncounter({ id: 'drone' })).toBeNull();
});
