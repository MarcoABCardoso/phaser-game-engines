import { PlatformerScene, createPrecisionPlatformerRecipe } from '@phaser-game-engines/toolkit/platformer';
import { level } from '../content/level.js';
import { GoalEntity } from '../entities/GoalEntity.js';
import { controls, controlsLabel } from '../input/controls.js';
import { installHud, installPauseMenu, playCue, updatePlayerPresentation } from '../presentation/presentation.js';
import { getStageOutcome } from '../rules/game-rules.js';

export class GameScene extends PlatformerScene {
  stageFinished = false;

  constructor() {
    super({
      key: 'play',
      recipes: [createPrecisionPlatformerRecipe()],
      controls,
      entityTypes: { 'signal-goal': GoalEntity },
    });
  }

  // Toolkit content provider: the base scene validates and builds this level.
  getLevel() {
    return level;
  }

  // Toolkit lifecycle hook: cache the game-owned objective after entities spawn.
  onEntitiesBuilt() {
    const goal = this.entities?.get('signal');
    if (!goal) throw new Error('Level must contain the signal goal entity.');
    this.goal = goal;
  }

  // Toolkit lifecycle hook: install game-owned presentation for each scene run.
  onReady() {
    this.stageFinished = false;
    this.hud = installHud(this, 'Objective: reach the gold signal');
    this.hud.setControls(controlsLabel);
    installPauseMenu(this);
  }

  // Game orchestration: gather runtime facts, ask the pure rule, then apply its outcome.
  onTick(time, _delta) {
    updatePlayerPresentation(this, time);
    const playerPosition = this.player.body?.center ?? this.player;
    this.evaluateStageOutcome(playerPosition);
  }

  // Top-down goals also report Arcade overlap, so contact cannot be missed between ticks.
  onGoalContact(goal) {
    if (goal === this.goal) this.evaluateStageOutcome(goal.spec);
  }

  evaluateStageOutcome(playerPosition) {
    const outcome = getStageOutcome({ player: playerPosition, goal: this.goal.spec });
    if (outcome) this.finishStage(outcome);
  }

  // Browser controls call this seam; frame-based adapters read the action on the next tick.
  performAction() {
    // The selected adapter state is consumed by the next scene tick.
  }

  finishStage(outcome) {
    if (this.stageFinished) return;
    this.stageFinished = true;
    playCue(this, 'win');
    this.scene.start('result', { won: outcome.kind === 'won' });
  }
}
