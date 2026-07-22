import { BattleScene, createBattlePresentationRecipe } from '@phaser-game-engines/toolkit/battle';
import { battleRules } from '../rules/battle-rules.js';
import { battleControls } from '../input/controls.js';
import { campaign } from '../state/campaign.js';

export class EncounterScene extends BattleScene {
  returning = false;

  constructor() {
    super({
      key: 'encounter',
      recipes: [createBattlePresentationRecipe({
        ...battleControls,
        x: 330,
        y: 390,
        reducedMotion: true,
      })],
    });
  }

  init(data) {
    this.encounter = data.encounter;
    this.returning = false;
    this.lastEvent = 'Damage is rolled when an attack lands.';
    this.enemyDisplays = new Map();
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
    this.cameras.main.setBackgroundColor('#172554');
    this.add.rectangle(480, 270, 960, 540, 0x172554);
    this.add.ellipse(760, 190, 360, 95, 0x334155, 0.65);
    this.add.ellipse(155, 425, 250, 70, 0x0f172a, 0.7);
    this.add.text(24, 20, `Battle: ${this.encounter.label}`, {
      fontFamily: 'sans-serif', fontSize: '26px', color: '#ffffff',
    });

    this.playerAvatar = this.add.container(155, 385, [
      this.add.ellipse(0, 30, 105, 28, 0x020617, 0.55),
      this.add.circle(0, -12, 30, 0x60a5fa).setStrokeStyle(4, 0xdbeafe),
      this.add.rectangle(0, 30, 68, 64, 0x2563eb).setStrokeStyle(4, 0x93c5fd),
    ]);
    this.add.text(42, 244, 'PLAYER', { fontFamily: 'monospace', fontSize: '17px', color: '#bfdbfe' });
    this.playerHpBack = this.add.rectangle(42, 278, 240, 18, 0x450a0a).setOrigin(0, 0.5).setStrokeStyle(2, 0xffffff);
    this.playerHpFill = this.add.rectangle(42, 278, 240, 14, 0x22c55e).setOrigin(0, 0.5);
    this.playerHpText = this.add.text(42, 292, '', { fontFamily: 'monospace', fontSize: '16px', color: '#ffffff' });

    Object.values(this.battle.state.game.enemies).forEach((enemy, index) => {
      const x = 690 + index * 145;
      const y = 105 + (index % 2) * 42;
      const container = this.add.container(x, y, [
        this.add.ellipse(0, 46, 120, 30, 0x020617, 0.5),
        this.add.circle(0, 12, 31, enemy.color ?? 0xef4444).setStrokeStyle(4, 0xfef2f2),
        this.add.rectangle(0, 35, 76, 42, enemy.color ?? 0xef4444).setStrokeStyle(3, 0xfecaca),
      ]);
      const label = this.add.text(x - 62, y - 44, enemy.label, {
        fontFamily: 'sans-serif', fontSize: '15px', color: '#ffffff',
      });
      const hpBack = this.add.rectangle(x - 62, y - 20, 124, 12, 0x450a0a).setOrigin(0, 0.5);
      const hpFill = this.add.rectangle(x - 62, y - 20, 124, 8, 0x4ade80).setOrigin(0, 0.5);
      const hpText = this.add.text(x + 66, y - 30, '', { fontFamily: 'monospace', fontSize: '13px', color: '#ffffff' });
      this.enemyDisplays.set(enemy.id, { objects: [container, label, hpBack, hpFill, hpText], hpFill, hpText });
    });

    this.status = this.add.text(320, 250, '', {
      fontFamily: 'monospace', fontSize: '17px', color: '#ddd6fe', lineSpacing: 7,
      wordWrap: { width: 610 },
    });
  }

  pgeRenderBattleState(state) {
    const { player, enemies } = state.game;
    const playerRatio = player.maxHp ? player.hp / player.maxHp : 0;
    this.playerHpFill.displayWidth = 240 * playerRatio;
    this.playerHpFill.setFillStyle(playerRatio > 0.35 ? 0x22c55e : 0xef4444);
    this.playerHpText.setText(`HP ${player.hp}/${player.maxHp}   ATK ${player.attack}   DEF ${player.defense}${player.guarding ? '   GUARDING' : ''}`);

    for (const [id, display] of this.enemyDisplays) {
      const enemy = enemies[id];
      const alive = enemy.hp > 0;
      for (const object of display.objects) object.setVisible(alive);
      if (!alive) continue;
      display.hpFill.displayWidth = 124 * (enemy.hp / enemy.maxHp);
      display.hpText.setText(`${enemy.hp}/${enemy.maxHp}`);
    }
    this.status.setText(this.lastEvent);
  }

  pgeOnBattleEvent(type, payload) {
    if (type === 'damageDealt') {
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
    this.showBattleResult(payload.outcome);
    this.time.delayedCall(1600, () => {
      this.scene.wake('world');
      this.scene.stop();
    });
  }

  showBattleResult(outcome) {
    const won = outcome.kind === 'won';
    this.add.rectangle(480, 270, 620, 250, 0x020617, 0.94)
      .setStrokeStyle(4, won ? 0x4ade80 : 0xf87171).setDepth(1000);
    this.add.text(480, 225, won ? 'BATTLE COMPLETE' : 'DEFEAT', {
      fontFamily: 'sans-serif', fontSize: '38px', fontStyle: 'bold', color: won ? '#86efac' : '#fca5a5',
    }).setOrigin(0.5).setDepth(1001);
    this.add.text(480, 292, won ? 'All enemies defeated' : 'Return with equipment, healing, and a plan', {
      fontFamily: 'sans-serif', fontSize: '20px', color: '#ffffff',
    }).setOrigin(0.5).setDepth(1001);
    this.add.text(480, 336, 'Returning to the world…', {
      fontFamily: 'monospace', fontSize: '16px', color: '#94a3b8',
    }).setOrigin(0.5).setDepth(1001);
  }
}
