import Phaser from 'phaser';
import { BattleScene } from '@phaser-game-engines/turn-based-battle';

class NegotiationScene extends BattleScene {
  getBattle() { return { delegates: ['river', 'hill'], support: { river: 0, hill: 0 }, roundLimit: 3 }; }
  getBattleRules() {
    return {
      createInitialState: structuredClone,
      getTurnOrder: (state) => state.delegates,
      getAvailableCommands: (state, actorId) => [
        { id: 'reason', actorId },
        { id: 'listen', actorId },
      ],
      resolveCommand: (state, command) => ({
        changes: [{ type: 'increment', path: ['support', command.actorId], value: command.id === 'listen' ? 2 : 1 }],
        effects: [{ id: 'present-argument', approach: command.id, speaker: command.actorId }],
      }),
      getOutcome: (state, context) => context.machine.round > state.roundLimit
        ? { agreement: Object.entries(state.support).sort((a, b) => b[1] - a[1])[0][0], support: state.support }
        : null,
    };
  }
  getMenuOptions(state, actorId) {
    return [
      { id: 'reason', label: 'Make a reasoned case (+1)', command: { id: 'reason', actorId } },
      { id: 'listen', label: 'Listen and reframe (+2)', command: { id: 'listen', actorId } },
    ];
  }
  create() {
    super.create();
    this.board = this.add.text(28, 24, '', { fontFamily: 'monospace', fontSize: '19px', color: '#fff4d1', lineSpacing: 10 });
    this.renderBattleState(this.battle.state);
  }
  onBattleEvent(type) {
    if (type !== 'effectRequested') return;
    this.time.delayedCall(250, () => {
      this.battle.completeEffect();
      this.refresh();
    });
  }
  renderBattleState(state) {
    if (!this.board) return;
    const support = Object.entries(state.game.support).map(([id, value]) => `${id.padEnd(8)} ${'◆'.repeat(value)}${'◇'.repeat(6 - value)}`).join('\n');
    this.board.setText(`COUNCIL NEGOTIATION\nNo health, damage, or elimination\n\n${support}\n\nRound ${state.machine.round}/${state.game.roundLimit}\n${state.machine.outcome ? `Agreement favors ${state.machine.outcome.agreement}.` : 'Build support through dialogue.'}`);
  }
}

new Phaser.Game({ type: Phaser.AUTO, parent: 'game', width: 760, height: 480, backgroundColor: '#29223b', scene: [NegotiationScene] });
