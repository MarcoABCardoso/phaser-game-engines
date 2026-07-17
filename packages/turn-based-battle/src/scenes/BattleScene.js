import Phaser from 'phaser';
import BattleController from '../systems/BattleController.js';

// Optional Phaser adapter. It knows only how to navigate game-provided menu
// options; rendering, targets, and command semantics belong to the subclass.
export default class BattleScene extends Phaser.Scene {
  getBattle() { throw new Error('BattleScene subclasses must implement getBattle()'); }
  getBattleRules() { throw new Error('BattleScene subclasses must implement getBattleRules()'); }
  getMenuOptions() { return []; } // [{ id, label, command }]
  getTargetOptions() { return []; } // optional [{ id, label }]
  buildCommand(option, target) { return { ...option.command, targetId: target?.id }; }
  create() {
    this.battle = new BattleController(this.getBattle(), { rules: this.getBattleRules(), rng: this.battleRng?.bind(this) ?? Math.random, emit: this.handleBattleEvent.bind(this) });
    this.keys = this.input.keyboard.addKeys({ up: Phaser.Input.Keyboard.KeyCodes.UP, down: Phaser.Input.Keyboard.KeyCodes.DOWN, confirm: Phaser.Input.Keyboard.KeyCodes.Z, enter: Phaser.Input.Keyboard.KeyCodes.ENTER, cancel: Phaser.Input.Keyboard.KeyCodes.X, escape: Phaser.Input.Keyboard.KeyCodes.ESC });
    this.menuText = this.add.text(20, this.scale.height - 110, '', { fontFamily: 'monospace', fontSize: '16px', color: '#fff', lineSpacing: 7 });
    this.menuIndex = 0; this.targetIndex = 0; this.menuPhase = 'command'; this.battle.start(); this.refresh(); this.runAi();
  }
  update() {
    const machine = this.battle.state.machine; if (machine.phase !== 'command-selection' || !this.isPlayerTurn(machine.activeId)) return;
    const confirm = Phaser.Input.Keyboard.JustDown(this.keys.confirm) || Phaser.Input.Keyboard.JustDown(this.keys.enter);
    const cancel = Phaser.Input.Keyboard.JustDown(this.keys.cancel) || Phaser.Input.Keyboard.JustDown(this.keys.escape);
    const delta = Phaser.Input.Keyboard.JustDown(this.keys.up) ? -1 : Phaser.Input.Keyboard.JustDown(this.keys.down) ? 1 : 0;
    if (this.menuPhase === 'command') { const options = this.getMenuOptions(this.battle.state, machine.activeId); if (delta && options.length) { this.menuIndex = (this.menuIndex + delta + options.length) % options.length; this.refresh(); } if (confirm && options.length) { this.option = options[this.menuIndex]; const targets = this.getTargetOptions(this.battle.state, machine.activeId, this.option); if (targets.length) { this.menuPhase = 'target'; this.targetIndex = 0; } else this.submit(this.option); this.refresh(); } }
    else { const targets = this.getTargetOptions(this.battle.state, machine.activeId, this.option); if (delta && targets.length) { this.targetIndex = (this.targetIndex + delta + targets.length) % targets.length; this.refresh(); } if (cancel) { this.menuPhase = 'command'; this.refresh(); } if (confirm && targets.length) this.submit(this.option, targets[this.targetIndex]); }
  }
  submit(option, target) { this.battle.submitCommand(this.buildCommand(option, target)); this.menuPhase = 'command'; this.menuIndex = 0; this.option = null; this.refresh(); this.runAi(); }
  isPlayerTurn() { return true; }
  chooseAiCommand() { return null; }
  runAi() { const activeId = this.battle.state.machine.activeId; if (this.battle.state.machine.phase !== 'command-selection' || this.isPlayerTurn(activeId)) return; this.time.delayedCall(300, () => { const command = this.chooseAiCommand(this.battle.state, activeId); if (command) this.battle.submitCommand(command); this.refresh(); this.runAi(); }); }
  handleBattleEvent(type, payload) { this.onBattleEvent(type, payload); }
  onBattleEvent() {}
  renderBattleState() {}
  refresh() { this.renderBattleState(this.battle.state); const id = this.battle.state.machine.activeId; if (this.battle.state.machine.phase !== 'command-selection' || !this.isPlayerTurn(id)) return; if (this.menuPhase === 'target') { const targets = this.getTargetOptions(this.battle.state, id, this.option); this.menuText.setText(`Target: ${targets[this.targetIndex]?.label ?? ''}\nUp/Down: choose  Z/Enter: confirm  X/Esc: back`); } else { const options = this.getMenuOptions(this.battle.state, id); this.menuText.setText(options.map((option, index) => `${index === this.menuIndex ? '▶' : ' '} ${option.label}`).join('\n') + '\nUp/Down: choose  Z/Enter: select'); } }
}
