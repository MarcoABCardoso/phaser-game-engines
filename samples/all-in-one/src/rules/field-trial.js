export const fieldTrialDefinition = Object.freeze({
  id: 'field-trial',
  label: 'Mira’s field trial',
  requiredItems: Object.freeze(['sword', 'charm']),
  encounterId: 'training-drone',
});

export function createFieldTrialState() {
  return {
    status: 'available',
    objectives: { sword: false, charm: false },
  };
}

export function recordFieldTrialItem(trial, item) {
  if (!fieldTrialDefinition.requiredItems.includes(item.kind)) return structuredClone(trial);
  return {
    ...structuredClone(trial),
    objectives: { ...trial.objectives, [item.kind]: true },
  };
}

export function resolveGuideInteraction(trial) {
  const next = structuredClone(trial);
  const prepared = fieldTrialDefinition.requiredItems.every((kind) => next.objectives[kind]);

  if (next.status === 'available') {
    next.status = 'active';
    return {
      trial: next,
      lines: [
        { speaker: 'Mira', text: 'The pass is blocked by two training drones. I need someone to clear them.' },
        { speaker: 'Mira', text: 'Find the rusty sword and sky charm, then report back to me.' },
      ],
    };
  }
  if (next.status === 'active' && !prepared) {
    const missing = fieldTrialDefinition.requiredItems
      .filter((kind) => !next.objectives[kind])
      .map((kind) => kind === 'sword' ? 'rusty sword' : 'sky charm');
    return {
      trial: next,
      lines: [{ speaker: 'Mira', text: `You still need the ${missing.join(' and ')}. The tonic may help after a failed attempt.` }],
    };
  }
  if (next.status === 'active') {
    next.status = 'authorized';
    return {
      trial: next,
      lines: [
        { speaker: 'Mira', text: 'That equipment should be enough. I have activated the training encounter.' },
        { speaker: 'Mira', text: 'Equip your finds from the inventory, then challenge the drones to the east.' },
      ],
    };
  }
  if (next.status === 'authorized') {
    return {
      trial: next,
      lines: [{ speaker: 'Mira', text: 'The trial is active. Use Attack and Guard, and choose targets carefully.' }],
    };
  }
  return {
    trial: next,
    lines: [{ speaker: 'Mira', text: 'The pass is safe again. You proved the whole expedition loop works.' }],
  };
}

export function completeFieldTrial(trial) {
  return { ...structuredClone(trial), status: 'complete' };
}

export function fieldTrialView(trial) {
  const objective = (done, label) => `${done ? '✓' : '○'} ${label}`;
  if (trial.status === 'available') {
    return { label: fieldTrialDefinition.label, lines: ['○ Talk to Mira by the camp'] };
  }
  if (trial.status === 'authorized') {
    return { label: fieldTrialDefinition.label, lines: ['✓ Prepare equipment', '○ Defeat the training drones'] };
  }
  if (trial.status === 'complete') {
    return { label: fieldTrialDefinition.label, lines: ['✓ Training drones defeated', 'Trial complete'] };
  }
  return {
    label: fieldTrialDefinition.label,
    lines: [
      objective(trial.objectives.sword, 'Find the rusty sword'),
      objective(trial.objectives.charm, 'Find the sky charm'),
      trial.objectives.sword && trial.objectives.charm ? '○ Report back to Mira' : '○ Prepare for the trial',
    ],
  };
}
