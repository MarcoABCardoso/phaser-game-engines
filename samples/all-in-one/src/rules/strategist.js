export const strategyChoices = Object.freeze([
  Object.freeze({ id: 'power', label: 'Overcharge the blade' }),
  Object.freeze({ id: 'guard', label: 'Stabilize the shield' }),
]);

export function strategistConversation(choice) {
  if (choice === 'power') {
    return [{ speaker: 'Tarin', text: 'The blade calibration is holding. Your attacks carry one extra point of force.' }];
  }
  if (choice === 'guard') {
    return [{ speaker: 'Tarin', text: 'The shield calibration is holding. Your defense has one extra point of stability.' }];
  }
  return [
    { speaker: 'Tarin', text: 'I can tune your field rig once. The choice will change your battle statistics.' },
    {
      speaker: 'Tarin',
      text: 'Choose a permanent calibration.',
      choices: strategyChoices,
    },
  ];
}

export function chooseStrategy(current, choice) {
  if (current) return current;
  if (!strategyChoices.some(({ id }) => id === choice)) throw new Error(`Unknown strategy choice: ${choice}`);
  return choice;
}

export function strategyBonuses(choice) {
  return {
    attack: choice === 'power' ? 1 : 0,
    defense: choice === 'guard' ? 1 : 0,
  };
}
