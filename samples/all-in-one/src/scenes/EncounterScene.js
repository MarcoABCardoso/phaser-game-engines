import { BattleScene, createBattlePresentationRecipe } from '@phaser-game-engines/toolkit/battle';
import { battleRules } from '../rules/battle-rules.js';
import { battleControls } from '../input/controls.js';
import { campaign } from '../state/campaign.js';

export class EncounterScene extends BattleScene {
  returning = false;

  constructor() {
    super({
      key: 'encounter',
      recipes: [createBattlePresentationRecipe({ ...battleControls, reducedMotion: true })],
    });
  }

  init(data) {
    this.encounter = data.encounter;
    this.returning = false;
  }

  getBattle() { return this.encounter.battleSpec; }
  getBattleRules() { return battleRules; }
  isPlayerTurn(id) { return id === 'player'; }
  getTargetOptions() { return []; }
  getMenuOptions() {
    return this.battle.availableCommands().map((command) => ({
      label: command.id === 'overload' ? 'Overload (3, costs 1)' : 'Focus (2)',
      command,
    }));
  }
  chooseAiCommand(_state, actorId) { return { id: 'focus', actorId }; }

  performAction() {
    if (this.battle?.state.machine.phase !== 'command-selection') return;
    if (this.battle.state.machine.activeId !== 'player') return;
    this.submitBattleCommand({ id: 'focus', actorId: 'player' });
    const { phase, activeId } = this.battle.state.machine;
    if (phase === 'command-selection' && activeId && activeId !== 'player') {
      this.submitBattleCommand(this.chooseAiCommand(this.battle.state, activeId));
    }
  }

  createBattleDisplay() {
    this.cameras.main.setBackgroundColor('#24142f');
    this.add.text(24, 24, `Turn-based battle: ${this.encounter.label}`, {
      fontFamily: 'sans-serif', fontSize: '26px', color: '#ffffff',
    });
    this.status = this.add.text(24, 82, '', {
      fontFamily: 'monospace', fontSize: '22px', color: '#ddd6fe', lineSpacing: 8,
    });
  }

  renderBattleState(state) {
    this.status.setText(`Player resolve: ${state.game.playerResolve}\nDrone resolve: ${state.game.rivalResolve}`);
  }

  onBattleEvent(type, payload) {
    if (type !== 'battleEnded' || this.returning) return;
    this.returning = true;
    campaign.completeEncounter(payload.outcome);
    this.time.delayedCall(350, () => {
      this.scene.wake('world');
      this.scene.stop();
    });
  }
}
