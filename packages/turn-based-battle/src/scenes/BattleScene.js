import Phaser from 'phaser';
import BattleController from '../systems/BattleController.js';

const COMMAND_PHASE = 'command-selection';
const MENU_PHASE = Object.freeze({
  command: 'command',
  target: 'target',
});

// Optional Phaser adapter. It owns keyboard-driven menu navigation while the
// subclass supplies domain rules, choices, commands, and presentation.
export default class BattleScene extends Phaser.Scene {
  getBattle() {
    throw new Error('BattleScene subclasses must implement getBattle()');
  }

  getBattleRules() {
    throw new Error('BattleScene subclasses must implement getBattleRules()');
  }

  getMenuOptions() { return []; } // [{ id, label, command }]
  getTargetOptions() { return []; } // optional [{ id, label }]
  isPlayerTurn() { return true; }
  chooseAiCommand() { return null; }
  createBattleDisplay() {}
  onBattleEvent() {}
  renderBattleState() {}

  buildCommand(option, target) {
    return { ...option.command, targetId: target?.id };
  }

  create() {
    this.createBattleController();
    this.createMenuInput();
    this.createMenuDisplay();
    this.resetMenu();

    // The hook runs before the battle starts, so the first refresh can render
    // into display objects created by the subclass.
    this.createBattleDisplay();
    this.battle.start();
    this.refresh();
    this.runAi();
  }

  createBattleController() {
    this.battle = new BattleController(this.getBattle(), {
      rules: this.getBattleRules(),
      rng: this.battleRng?.bind(this) ?? Math.random,
      emit: this.handleBattleEvent.bind(this),
    });
  }

  createMenuInput() {
    this.keys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      confirm: Phaser.Input.Keyboard.KeyCodes.Z,
      enter: Phaser.Input.Keyboard.KeyCodes.ENTER,
      cancel: Phaser.Input.Keyboard.KeyCodes.X,
      escape: Phaser.Input.Keyboard.KeyCodes.ESC,
    });
  }

  createMenuDisplay() {
    this.menuText = this.add.text(20, this.scale.height - 110, '', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#fff',
      lineSpacing: 7,
    });
  }

  update() {
    const { machine } = this.battle.state;
    if (!this.canPlayerChoose(machine)) return;

    const input = this.readMenuInput();
    if (this.menuPhase === MENU_PHASE.target) {
      this.updateTargetMenu(machine.activeId, input);
    } else {
      this.updateCommandMenu(machine.activeId, input);
    }
  }

  canPlayerChoose(machine = this.battle.state.machine) {
    return machine.phase === COMMAND_PHASE && this.isPlayerTurn(machine.activeId);
  }

  readMenuInput() {
    const pressed = (key) => Phaser.Input.Keyboard.JustDown(key);
    return {
      confirm: pressed(this.keys.confirm) || pressed(this.keys.enter),
      cancel: pressed(this.keys.cancel) || pressed(this.keys.escape),
      direction: pressed(this.keys.up) ? -1 : pressed(this.keys.down) ? 1 : 0,
    };
  }

  updateCommandMenu(activeId, input) {
    const options = this.getMenuOptions(this.battle.state, activeId);
    if (!options.length) return;

    if (input.direction) {
      this.menuIndex = this.wrapIndex(this.menuIndex + input.direction, options.length);
      this.refresh();
    }

    if (!input.confirm) return;
    this.selectCommand(options[this.menuIndex], activeId);
  }

  selectCommand(option, activeId) {
    this.selectedOption = option;
    this.option = option; // Backward-compatible alias for existing subclasses.
    const targets = this.getTargetOptions(this.battle.state, activeId, option);

    if (targets.length) {
      this.menuPhase = MENU_PHASE.target;
      this.targetIndex = 0;
      this.refresh();
      return;
    }

    this.submit(option);
  }

  updateTargetMenu(activeId, input) {
    const targets = this.getTargetOptions(
      this.battle.state,
      activeId,
      this.selectedOption,
    );

    if (input.direction && targets.length) {
      this.targetIndex = this.wrapIndex(
        this.targetIndex + input.direction,
        targets.length,
      );
      this.refresh();
    }

    if (input.cancel) {
      this.menuPhase = MENU_PHASE.command;
      this.refresh();
      return;
    }

    if (input.confirm && targets.length) {
      this.submit(this.selectedOption, targets[this.targetIndex]);
    }
  }

  wrapIndex(index, optionCount) {
    return (index + optionCount) % optionCount;
  }

  submit(option, target) {
    this.battle.submitCommand(this.buildCommand(option, target));
    this.resetMenu();
    this.refresh();
    this.runAi();
  }

  resetMenu() {
    this.menuIndex = 0;
    this.targetIndex = 0;
    this.menuPhase = MENU_PHASE.command;
    this.selectedOption = null;
    this.option = null;
  }

  runAi() {
    const { activeId, phase } = this.battle.state.machine;
    if (phase !== COMMAND_PHASE || this.isPlayerTurn(activeId)) return;

    this.time.delayedCall(300, () => {
      const command = this.chooseAiCommand(this.battle.state, activeId);
      if (command) this.battle.submitCommand(command);
      this.refresh();
      this.runAi();
    });
  }

  handleBattleEvent(type, payload) {
    this.onBattleEvent(type, payload);
  }

  refresh() {
    const state = this.battle.state;
    this.renderBattleState(state);

    if (!this.canPlayerChoose(state.machine)) {
      this.menuText.setText('');
      return;
    }

    if (this.menuPhase === MENU_PHASE.target) {
      this.renderTargetMenu(state.machine.activeId);
    } else {
      this.renderCommandMenu(state.machine.activeId);
    }
  }

  renderCommandMenu(activeId) {
    const options = this.getMenuOptions(this.battle.state, activeId);
    const rows = options.map((option, index) => {
      const cursor = index === this.menuIndex ? '▶' : ' ';
      return `${cursor} ${option.label}`;
    });

    this.menuText.setText([
      ...rows,
      'Up/Down: choose  Z/Enter: select',
    ].join('\n'));
  }

  renderTargetMenu(activeId) {
    const targets = this.getTargetOptions(
      this.battle.state,
      activeId,
      this.selectedOption,
    );
    const selectedTarget = targets[this.targetIndex];

    this.menuText.setText([
      `Target: ${selectedTarget?.label ?? ''}`,
      'Up/Down: choose  Z/Enter: confirm  X/Esc: back',
    ].join('\n'));
  }
}
