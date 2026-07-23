import {
  BattleScene,
  createBattlePresentationRecipe,
  createBattleResultPresentationRecipe,
} from '@phaser-game-engines/toolkit/battle';
import { battleRules } from '../rules/battle-rules.js';
import { battleControls } from '../input/controls.js';
import {
  battleResultModel,
  createBattleEnemy,
  createBattleField,
  createBattlePlayer,
  createBattleResult,
} from '../presentation/battle-presentation.js';
import { campaign } from '../state/campaign.js';

const ANIMATED_EFFECTS = new Set(['all-in-one.attack', 'all-in-one.guard']);

export class EncounterScene extends BattleScene {
  returning = false;

  constructor() {
    super({
      key: 'encounter',
      recipes: [
        createBattlePresentationRecipe({
          ...battleControls,
          x: 330,
          y: 390,
          reducedMotion: true,
        }),
        createBattleResultPresentationRecipe({ getModel: battleResultModel }),
      ],
      presentation: {
        prefabs: {
          'battle.player': createBattlePlayer,
          'battle.enemy': createBattleEnemy,
        },
        presenters: {
          'battle.field': createBattleField,
          'battle.result': createBattleResult,
        },
      },
    });
  }

  init(data) {
    this.encounter = data.encounter;
    this.returning = false;
    this.deferBattleRefresh = false;
    this.lastEvent = 'Damage is rolled when an attack lands.';
  }

  getBattle() { return this.encounter.battleSpec; }
  getBattleRules() { return battleRules; }
  isPlayerTurn(id) { return id === 'player'; }
  getTargetOptions(state, _activeId, command) {
    if (command.command.id !== 'attack') return [];
    return Object.values(state.game.enemies)
      .filter((enemy) => enemy.hp > 0)
      .map((enemy) => ({ id: enemy.id, label: `${enemy.label} — HP ${enemy.hp}/${enemy.maxHp}` }));
  }
  getMenuOptions() {
    return this.battle.availableCommands().map((command) => ({
      label: command.id === 'guard' ? 'Guard (double defense)' : 'Attack',
      command,
    }));
  }
  chooseAiCommand(state, actorId) {
    return {
      id: state.game.turn % 5 === 4 ? 'guard' : 'attack',
      actorId,
      ...(state.game.turn % 5 === 4 ? {} : { targetId: 'player' }),
    };
  }

  performAction() {
    if (this.battle?.state.machine.phase !== 'command-selection') return;
    if (this.battle.state.machine.activeId !== 'player') return;
    const target = Object.values(this.battle.state.game.enemies).find((enemy) => enemy.hp > 0);
    if (!target) return;
    this.submitBattleCommand({ id: 'attack', actorId: 'player', targetId: target.id });
    while (this.battle.state.machine.phase === 'command-selection'
      && this.battle.state.machine.activeId
      && this.battle.state.machine.activeId !== 'player') {
      const activeId = this.battle.state.machine.activeId;
      this.submitBattleCommand(this.chooseAiCommand(this.battle.state, activeId));
    }
  }

  pgeCreateBattleDisplay() {
    this.battleField = this.present('battle.field', { model: this.battleViewModel(this.battle.state) });
  }

  pgeRenderBattleState(state) {
    if (this.deferBattleRefresh) return;
    this.battleField.update(this.battleViewModel(state));
  }

  battleViewModel(state) {
    return { label: this.encounter.label, state, status: this.lastEvent };
  }

  pgeOnBattleEvent(type, payload) {
    if (type === 'effectQueued' && ANIMATED_EFFECTS.has(payload.effect.type)) {
      this.deferBattleRefresh = true;
    } else if (type === 'effectRequested' && ANIMATED_EFFECTS.has(payload.effect.type)) {
      this.battleField.body.play(payload.effect, {
        onImpact: () => {
          this.deferBattleRefresh = false;
          this.refresh();
        },
        onComplete: () => {
          if (this.battle?.state.machine.phase === 'presentation') this.completeBattleEffect();
        },
      });
    } else if (type === 'damageDealt') {
      const attacker = payload.actorId === 'player' ? 'You' : this.battle.state.game.enemies[payload.actorId]?.label;
      const target = payload.targetId === 'player' ? 'you' : this.battle.state.game.enemies[payload.targetId]?.label;
      this.lastEvent = `${attacker} dealt ${payload.damage} damage to ${target}${payload.guarded ? ' through guard' : ''}.${payload.defeated ? ` ${target} was defeated!` : ''}`;
    } else if (type === 'guardRaised') {
      const actor = payload.actorId === 'player' ? 'You brace' : `${this.battle.state.game.enemies[payload.actorId]?.label} braces`;
      this.lastEvent = `${actor} for incoming attacks.`;
    }
    if (type !== 'battleEnded' || this.returning) return;
    this.returning = true;
    campaign.completeEncounter(payload.outcome);
    this.time.delayedCall(1600, () => {
      this.scene.wake('world');
      this.scene.stop();
    });
  }

}
