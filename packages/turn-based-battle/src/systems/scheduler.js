/**
 * Default deterministic round scheduler. It has no participant schema: rules
 * provide IDs, while transactions may add, remove, or prioritize IDs.
 */
export function createRoundScheduler() {
  return Object.freeze({
    createSchedule(state, context) {
      return [...(context.rules.getTurnOrder(state, context) ?? [])];
    },
    next(schedule) { return schedule.shift() ?? null; },
  });
}

export function applyScheduleChange(schedule, change = {}) {
  let next = [...schedule];
  const removed = new Set(change.remove ?? change.leave ?? []);
  if (removed.size) next = next.filter((id) => !removed.has(id));
  for (const id of change.prepend ?? change.next ?? []) {
    next = next.filter((entry) => entry !== id);
    next.unshift(id);
  }
  for (const id of change.append ?? change.enter ?? change.add ?? []) {
    if (!next.includes(id)) next.push(id);
  }
  return next;
}
