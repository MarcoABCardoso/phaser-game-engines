import { BattleScene } from '@phaser-game-engines/turn-based-battle';
import {
  battleSpec,
  findUnit,
  livingUnits,
  opposingSide,
} from './battle.js';
import { battleRules } from './rules.js';

function unitRow(unit, { showMp = false } = {}) {
  const hp = `HP ${unit.hp}/${unit.maxHp}`;
  const mp = showMp ? `  MP ${unit.mp}/${unit.maxMp}` : '';
  return `  ${unit.name.padEnd(8)} ${hp}${mp}`;
}

export default class BasicBattleScene extends BattleScene {
  getBattle() {
    return battleSpec;
  }

  getBattleRules() {
    return battleRules;
  }

  isPlayerTurn(actorId) {
    return findUnit(this.battle.state.game, actorId)?.side === 'heroes';
  }

  getMenuOptions(state, actorId) {
    return this.battle.rules
      .getAvailableCommands(state.game, actorId)
      .map((commandId) => ({
        id: commandId,
        label: commandId === 'cure' ? 'Cure (2 MP)' : 'Strike',
        command: { id: commandId, actorId },
      }));
  }

  getTargetOptions(state, actorId, option) {
    const actor = findUnit(state.game, actorId);
    const targetSide = option.id === 'cure'
      ? actor.side
      : opposingSide(actor.side);

    return livingUnits(state.game, targetSide).map((unit) => ({
      id: unit.id,
      label: unit.name,
    }));
  }

  chooseAiCommand(state, actorId) {
    const actor = findUnit(state.game, actorId);
    const target = livingUnits(state.game, opposingSide(actor.side))[0];
    return { id: 'strike', actorId, targetId: target.id };
  }

  createBattleDisplay() {
    this.board = this.add.text(28, 24, '', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#fff',
      lineSpacing: 8,
    });
  }

  renderBattleState(state) {
    const heroes = state.game.units
      .filter((unit) => unit.side === 'heroes')
      .map((unit) => unitRow(unit, { showMp: true }));
    const fiends = state.game.units
      .filter((unit) => unit.side === 'fiends')
      .map((unit) => unitRow(unit));
    const outcome = state.machine.outcome
      ? `${state.machine.outcome.winner} win!`
      : '';

    this.board.setText([
      'HEROES',
      ...heroes,
      '',
      'FIENDS',
      ...fiends,
      '',
      outcome,
    ].join('\n'));
  }
}
