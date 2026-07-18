export const negotiationSpec = {
  delegates: ['river', 'hill'],
  support: { river: 0, hill: 0 },
  roundLimit: 3,
};

export const approaches = [
  { id: 'reason', label: 'Make a reasoned case (+1)', support: 1 },
  { id: 'listen', label: 'Listen and reframe (+2)', support: 2 },
];

export function leadingDelegate(support) {
  return Object.entries(support)
    .sort(([, firstScore], [, secondScore]) => secondScore - firstScore)[0][0];
}
