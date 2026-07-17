import Phaser from 'phaser';
import { BattleScene } from '@phaser-game-engines/turn-based-battle';

const clone = structuredClone;

class PpBattleScene extends BattleScene {
  getBattle() {
    return { creatures: [
      { id: 'sprig', name: 'Sprig', type: 'leaf', weakTo: 'flame', condition: 'ready', moves: [{ id: 'vine', type: 'leaf', pp: 2 }] },
      { id: 'cinder', name: 'Cinder', type: 'flame', weakTo: 'leaf', condition: 'ready', moves: [{ id: 'spark', type: 'flame', pp: 2 }] },
    ] };
  }
  getBattleRules() {
    return {
      createInitialState: clone,
      getTurnOrder: (state) => state.creatures.filter((creature) => creature.condition === 'ready').map((creature) => creature.id),
      getAvailableCommands: (state, actorId) => state.creatures.find((entry) => entry.id === actorId).moves
        .filter((move) => move.pp > 0).map((move) => ({ id: 'useMove', actorId, moveId: move.id })),
      resolveCommand: (state, command) => {
        const next = clone(state);
        const actor = next.creatures.find((entry) => entry.id === command.actorId);
        const target = next.creatures.find((entry) => entry.id === command.targetId);
        const move = actor.moves.find((entry) => entry.id === command.moveId);
        move.pp -= 1;
        if (target.weakTo === move.type) target.condition = 'fainted';
        return { state: next, events: [{ type: 'moveUsed', detail: { command } }] };
      },
      getOutcome: (state) => state.creatures.find((creature) => creature.condition === 'ready')?.id
        && state.creatures.some((creature) => creature.condition === 'fainted')
        ? { winner: state.creatures.find((creature) => creature.condition === 'ready').id } : null,
    };
  }
  getMenuOptions(state, actorId) {
    const actor = state.game.creatures.find((entry) => entry.id === actorId);
    return actor.moves.filter((move) => move.pp > 0).map((move) => ({
      id: move.id, label: `${move.id} (${move.pp} PP / ${move.type})`,
      command: { id: 'useMove', actorId, moveId: move.id },
    }));
  }
  getTargetOptions(state, actorId) {
    return state.game.creatures.filter((entry) => entry.id !== actorId && entry.condition === 'ready')
      .map((entry) => ({ id: entry.id, label: entry.name }));
  }
  create() {
    super.create();
    this.board = this.add.text(28, 24, '', { fontFamily: 'monospace', fontSize: '19px', color: '#e7f7dd', lineSpacing: 10 });
    this.renderBattleState(this.battle.state);
  }
  renderBattleState(state) {
    if (!this.board) return;
    const rows = state.game.creatures.map((creature) => `${creature.name} [${creature.type}]  ${creature.condition}\n  ${creature.moves.map((move) => `${move.id}: ${move.pp} PP`).join('  ')}`);
    this.board.setText(`PP / TYPE DUEL\n\n${rows.join('\n\n')}\n\n${state.machine.outcome ? `${state.machine.outcome.winner} wins` : 'A weakness match ends the duel.'}`);
  }
}

new Phaser.Game({ type: Phaser.AUTO, parent: 'game', width: 760, height: 480, backgroundColor: '#183122', scene: [PpBattleScene] });
