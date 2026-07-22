import { BattleScene, createBattlePresentationRecipe } from '@phaser-game-engines/toolkit/battle';
import { battleSpec } from '../content/level.js';
import { rules } from '../rules/game-rules.js';
import { addHelp, playCue } from '../presentation/presentation.js';

export class GameScene extends BattleScene {
  constructor() { super({ key: 'play', recipes: [createBattlePresentationRecipe({ reducedMotion: true })] }); }
  getBattle() { return battleSpec; }
  getBattleRules() { return rules; }
  isPlayerTurn(id) { return id === 'player'; }
  getMenuOptions(_state, _actorId) {
    return this.battle.availableCommands().map((command) => ({
      label: command.id === 'overload' ? 'Overload (-1 self, -2 rival)' : 'Focus (-1 rival)',
      command,
    }));
  }
  getTargetOptions() { return []; }
  chooseAiCommand(_state, actorId) { return { id: 'focus', actorId }; }
  pgeCreateBattleDisplay() { this.status = addHelp(this, 'Reduce the rival signal to zero.'); }
  pgeRenderBattleState(state) {
    this.status.setText('Your signal: ' + state.game.playerResolve + '\nRival signal: ' + state.game.rivalResolve);
    if (state.machine.phase === 'finished') {  playCue(this, 'win'); this.time.delayedCall(250, () => this.scene.start('result', { won: state.machine.outcome?.kind === 'won' })); }
  }
  performAction() { if (this.battle?.state.machine.phase === 'command-selection' && this.battle.state.machine.activeId === 'player') this.submitBattleCommand({ id: 'focus', actorId: 'player' }); }
}
