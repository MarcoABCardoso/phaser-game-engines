export function getStageOutcome(
  state,
  radius = 48,
) {
  const { player, goal } = state;
  const reachedGoal = Math.hypot(player.x - goal.x, player.y - goal.y) <= radius;
  return reachedGoal ? { kind: 'won' } : null;
}
