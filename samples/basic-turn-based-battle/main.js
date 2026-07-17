import Phaser from 'phaser';
import { BattleScene } from '@phaser-game-engines/turn-based-battle';

const clone = (value) => structuredClone(value);
const living = (state, side) => state.units.filter((unit) => unit.side === side && unit.hp > 0);
class BasicBattleScene extends BattleScene {
  getBattle() { return { units: [
    { id: 'luna', name: 'Luna', side: 'heroes', hp: 36, maxHp: 36, mp: 8, maxMp: 8, speed: 9, power: 7 },
    { id: 'gaius', name: 'Gaius', side: 'heroes', hp: 44, maxHp: 44, mp: 0, maxMp: 0, speed: 5, power: 9 },
    { id: 'imp', name: 'Imp', side: 'fiends', hp: 28, maxHp: 28, mp: 0, maxMp: 0, speed: 4, power: 4 },
  ] }; }
  getBattleRules() { return {
    createInitialState: (spec) => clone(spec),
    getTurnOrder: (state) => state.units.filter((unit) => unit.hp > 0).sort((a, b) => b.speed - a.speed).map((unit) => unit.id),
    getAvailableCommands: (state, actorId) => actorId === 'luna' ? ['strike', 'cure'] : ['strike'],
    validateCommand: (state, command, commands) => commands.includes(command.id),
    resolveCommand: (state, command) => { const next = clone(state); const actor = next.units.find((unit) => unit.id === command.actorId); const target = next.units.find((unit) => unit.id === command.targetId); if (command.id === 'cure') { actor.mp -= 2; target.hp = Math.min(target.maxHp, target.hp + 9); } else target.hp = Math.max(0, target.hp - actor.power); return { state: next, events: [{ type: 'sampleAction', detail: { command } }] }; },
    getOutcome: (state) => !living(state, 'heroes').length ? { winner: 'fiends' } : !living(state, 'fiends').length ? { winner: 'heroes' } : null,
  }; }
  isPlayerTurn(id) { return this.battle.state.game.units.find((unit) => unit.id === id)?.side === 'heroes'; }
  getMenuOptions(state, actorId) { return this.battle.rules.getAvailableCommands(state.game, actorId).map((id) => ({ id, label: id === 'cure' ? 'Cure (2 MP)' : 'Strike', command: { id, actorId } })); }
  getTargetOptions(state, actorId, option) { const actor = state.game.units.find((unit) => unit.id === actorId); const side = option.id === 'cure' ? actor.side : actor.side === 'heroes' ? 'fiends' : 'heroes'; return living(state.game, side).map((unit) => ({ id: unit.id, label: unit.name })); }
  chooseAiCommand(state, actorId) { const actor = state.game.units.find((unit) => unit.id === actorId); const target = living(state.game, actor.side === 'heroes' ? 'fiends' : 'heroes')[0]; return { id: 'strike', actorId, targetId: target.id }; }
  create() { super.create(); this.board = this.add.text(28, 24, '', { fontFamily: 'monospace', fontSize: '18px', color: '#fff', lineSpacing: 8 }); this.renderBattleState(this.battle.state); }
  renderBattleState(state) { if (!this.board) return; const units = state.game.units; const heroes = units.filter((unit) => unit.side === 'heroes').map((unit) => `  ${unit.name.padEnd(8)} HP ${unit.hp}/${unit.maxHp}  MP ${unit.mp}/${unit.maxMp}`).join('\n'); const fiends = units.filter((unit) => unit.side === 'fiends').map((unit) => `  ${unit.name.padEnd(8)} HP ${unit.hp}/${unit.maxHp}`).join('\n'); this.board.setText(`HEROES\n${heroes}\n\nFIENDS\n${fiends}\n\n${state.machine.phase === 'finished' ? `${state.machine.outcome.winner} win!` : ''}`); }
}
new Phaser.Game({ type: Phaser.AUTO, parent: 'game', width: 760, height: 480, backgroundColor: '#171525', scene: [BasicBattleScene] });
