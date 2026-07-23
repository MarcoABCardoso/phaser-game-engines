export function createProgressionState() {
  return { level: 1, xp: 0, nextXp: 1, skillPoints: 0 };
}

export function grantFieldTrialReward(player, progression) {
  if (progression.level > 1) return { player, progression, credits: 0 };
  const maxHp = player.maxHp + 2;
  return {
    player: { ...player, hp: maxHp, maxHp, attack: player.attack + 1 },
    progression: { level: 2, xp: 0, nextXp: 2, skillPoints: progression.skillPoints + 1 },
    credits: 25,
  };
}
