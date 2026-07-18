import { BattleScene, createBattlePresentationRecipe } from '@phaser-game-engines/turn-based-battle';
import { approaches, negotiationSpec } from './battle.js';
import { negotiationRules } from './rules.js';

const MAX_SUPPORT_MARKERS = 6;

function supportRow(delegate, support) {
  const filled = '◆'.repeat(support);
  const empty = '◇'.repeat(Math.max(0, MAX_SUPPORT_MARKERS - support));
  return `${delegate.padEnd(8)} ${filled}${empty}`;
}

export default class NegotiationScene extends BattleScene {
  constructor() {
    super({ recipes: [createBattlePresentationRecipe()] });
  }

  getBattle() {
    return negotiationSpec;
  }

  getBattleRules() {
    return negotiationRules;
  }

  getMenuOptions(state, actorId) {
    return approaches.map((approach) => ({
      id: approach.id,
      label: approach.label,
      command: { id: approach.id, actorId },
    }));
  }

  createBattleDisplay() {
    this.board = this.add.text(28, 24, '', {
      fontFamily: 'monospace',
      fontSize: '19px',
      color: '#fff4d1',
      lineSpacing: 10,
    });
  }

  onBattleEvent(type) {
    if (type !== 'effectRequested') return;

    this.time.delayedCall(250, () => {
      this.battle.completeEffect();
      this.refresh();
    });
  }

  renderBattleState(state) {
    const support = Object.entries(state.game.support)
      .map(([delegate, score]) => supportRow(delegate, score));
    const status = state.machine.outcome
      ? `Agreement favors ${state.machine.outcome.agreement}.`
      : 'Build support through dialogue.';

    this.board.setText([
      'COUNCIL NEGOTIATION',
      'No health, damage, or elimination',
      '',
      ...support,
      '',
      `Round ${state.machine.round}/${state.game.roundLimit}`,
      status,
    ].join('\n'));
  }
}
