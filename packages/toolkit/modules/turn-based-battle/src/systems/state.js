// Generic, immutable state-patch helpers. They describe data changes without
// assigning combat meaning to fields such as hp, mana, PP, shields, or cards.
export function updateAtPath(value, path, updater) {
  if (!path.length) return updater(value);
  const [key, ...rest] = path;
  const copy = Array.isArray(value) ? [...value] : { ...value };
  copy[key] = updateAtPath(value?.[key], rest, updater);
  return copy;
}

export function applyChanges(state, changes = []) {
  return changes.reduce((next, change) => {
    const path = Array.isArray(change.path) ? change.path : String(change.path).split('.');
    if (change.type === 'set') return updateAtPath(next, path, () => change.value);
    if (change.type === 'increment') return updateAtPath(next, path, (value = 0) => value + change.value);
    if (change.type === 'append') return updateAtPath(next, path, (value = []) => [...value, change.value]);
    if (change.type === 'remove') return updateAtPath(next, path, (value = []) => value.filter((entry) => entry !== change.value));
    throw new Error(`Unknown state change type: ${change.type}`);
  }, state);
}
