import { BattleScene } from '@phaser-game-engines/turn-based-battle';
import {
  availableMoves,
  battleSpec,
  findCreature,
  readyCreatures,
} from './battle.js';
import { battleRules } from './rules.js';

function creatureSummary(creature) {
  const moves = creature.moves
    .map((move) => `${move.id}: ${move.pp} PP`)
    .join('  ');

  return [
    `${creature.name} [${creature.type}]  ${creature.condition}`,
    `  ${moves}`,
  ].join('\n');
}

export default class PpBattleScene extends BattleScene {
  getBattle() {
    return battleSpec;
  }

  getBattleRules() {
    return battleRules;
  }

  getMenuOptions(state, actorId) {
    const actor = findCreature(state.game, actorId);
    return availableMoves(actor).map((move) => ({
      id: move.id,
      label: `${move.id} (${move.pp} PP / ${move.type})`,
      command: { id: 'useMove', actorId, moveId: move.id },
    }));
  }

  getTargetOptions(state, actorId) {
    return readyCreatures(state.game)
      .filter((creature) => creature.id !== actorId)
      .map((creature) => ({ id: creature.id, label: creature.name }));
  }

  createBattleDisplay() {
    this.board = this.add.text(28, 24, '', {
      fontFamily: 'monospace',
      fontSize: '19px',
      color: '#e7f7dd',
      lineSpacing: 10,
    });
  }

  renderBattleState(state) {
    const creatures = state.game.creatures.map(creatureSummary);
    const status = state.machine.outcome
      ? `${state.machine.outcome.winner} wins`
      : 'A weakness match ends the duel.';

    this.board.setText([
      'PP / TYPE DUEL',
      '',
      creatures.join('\n\n'),
      '',
      status,
    ].join('\n'));
  }
}
