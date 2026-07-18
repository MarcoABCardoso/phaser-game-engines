import { defineRecipe } from '@phaser-game-engines/core';
import Phaser from 'phaser';

const COMMAND_PHASE = 'command-selection';

/** Keyboard/gamepad command and target menus with readable focus and pacing controls. */
export function createBattlePresentationRecipe(options = {}) {
  return defineRecipe({
    id: options.id ?? 'battle.menu-presentation',
    owns: ['battle.player-input', 'battle.menu-presentation', 'battle.ai-pacing'],
    policies: { presentation: (scene) => installPresentation(scene, options) },
  });
}

function installPresentation(scene, options) {
  const state = {
    phase: 'command',
    commandIndex: 0,
    targetIndex: 0,
    selected: null,
    timer: null,
    gamepad: { up: false, down: false, confirm: false, cancel: false },
  };
  const keys = scene.input.keyboard.addKeys({
    up: options.keys?.up ?? Phaser.Input.Keyboard.KeyCodes.UP,
    down: options.keys?.down ?? Phaser.Input.Keyboard.KeyCodes.DOWN,
    confirm: options.keys?.confirm ?? Phaser.Input.Keyboard.KeyCodes.Z,
    enter: options.keys?.confirmAlternate ?? Phaser.Input.Keyboard.KeyCodes.ENTER,
    cancel: options.keys?.cancel ?? Phaser.Input.Keyboard.KeyCodes.X,
    escape: options.keys?.cancelAlternate ?? Phaser.Input.Keyboard.KeyCodes.ESC,
  });
  const menuText = scene.add.text(
    options.x ?? 20,
    options.y ?? scene.scale.height - 110,
    '',
    {
      fontFamily: options.fontFamily ?? 'monospace',
      fontSize: `${options.textSize ?? 18}px`,
      color: options.color ?? '#ffffff',
      backgroundColor: options.backgroundColor ?? '#000000aa',
      lineSpacing: options.lineSpacing ?? 7,
      padding: { x: 8, y: 6 },
    },
  ).setScrollFactor(0).setDepth(options.depth ?? 100);

  const getCommands = (activeId) => options.getCommands?.(scene.battle.state, activeId, scene)
    ?? scene.getMenuOptions?.(scene.battle.state, activeId)
    ?? [];
  const getTargets = (activeId, command) => options.getTargets?.(scene.battle.state, activeId, command, scene)
    ?? scene.getTargetOptions?.(scene.battle.state, activeId, command)
    ?? [];
  const isPlayerTurn = (activeId) => options.isPlayerTurn?.(activeId, scene.battle.state, scene)
    ?? scene.isPlayerTurn?.(activeId)
    ?? true;
  const canChoose = () => scene.battle.state.machine.phase === COMMAND_PHASE
    && isPlayerTurn(scene.battle.state.machine.activeId);
  const wrap = (index, length) => length ? (index + length) % length : 0;
  const reset = () => Object.assign(state, { phase: 'command', commandIndex: 0, targetIndex: 0, selected: null });
  const buildCommand = (option, target) => options.buildCommand?.(option, target, scene)
    ?? scene.buildCommand?.(option, target)
    ?? { ...option.command, targetId: target?.id };

  const runAi = () => {
    const { activeId, phase } = scene.battle.state.machine;
    if (phase !== COMMAND_PHASE || isPlayerTurn(activeId)) return;
    const execute = () => {
      state.timer = null;
      const command = options.chooseAiCommand?.(scene.battle.state, activeId, scene)
        ?? scene.chooseAiCommand?.(scene.battle.state, activeId);
      if (command) scene.submitBattleCommand(command);
      runAi();
    };
    if (options.reducedMotion) execute();
    else state.timer = scene.time.delayedCall(options.effectDelayMs ?? 300, execute);
  };

  const render = () => {
    if (!canChoose()) {
      menuText.setText('');
      return;
    }
    const activeId = scene.battle.state.machine.activeId;
    if (state.phase === 'target') {
      const targets = getTargets(activeId, state.selected);
      menuText.setText([
        options.targetHeading ?? 'Choose target',
        ...targets.map((target, index) => `${index === state.targetIndex ? '▶' : ' '} ${target.label}`),
        options.targetHelp ?? 'Up/Down: choose  Z/Enter: confirm  X/Esc: back',
      ].join('\n'));
      return;
    }
    const commands = getCommands(activeId);
    menuText.setText([
      options.commandHeading ?? 'Choose command',
      ...commands.map((command, index) => `${index === state.commandIndex ? '▶' : ' '} ${command.label}`),
      options.commandHelp ?? 'Up/Down: choose  Z/Enter: select',
    ].join('\n'));
  };

  const submit = (option, target) => {
    scene.submitBattleCommand(buildCommand(option, target));
    reset();
    runAi();
  };
  const stopTick = scene.lifecycle.on('tick', () => {
    if (!canChoose()) return;
    const pad = options.gamepad === false ? null : scene.input.gamepad?.getPad(0);
    const threshold = options.axisThreshold ?? 0.55;
    const padNow = {
      up: Boolean(pad && (pad.up || pad.axes?.[1]?.getValue?.() < -threshold)),
      down: Boolean(pad && (pad.down || pad.axes?.[1]?.getValue?.() > threshold)),
      confirm: Boolean(pad?.buttons?.[options.confirmButton ?? 0]?.pressed),
      cancel: Boolean(pad?.buttons?.[options.cancelButton ?? 1]?.pressed),
    };
    const padPressed = (name) => padNow[name] && !state.gamepad[name];
    const direction = Phaser.Input.Keyboard.JustDown(keys.up) || padPressed('up') ? -1
      : Phaser.Input.Keyboard.JustDown(keys.down) || padPressed('down') ? 1 : 0;
    const confirm = Phaser.Input.Keyboard.JustDown(keys.confirm)
      || Phaser.Input.Keyboard.JustDown(keys.enter);
    const cancel = Phaser.Input.Keyboard.JustDown(keys.cancel)
      || Phaser.Input.Keyboard.JustDown(keys.escape);
    const confirmPressed = confirm || padPressed('confirm');
    const cancelPressed = cancel || padPressed('cancel');
    state.gamepad = padNow;
    const activeId = scene.battle.state.machine.activeId;
    if (state.phase === 'target') {
      const targets = getTargets(activeId, state.selected);
      if (direction) state.targetIndex = wrap(state.targetIndex + direction, targets.length);
      if (cancelPressed) state.phase = 'command';
      else if (confirmPressed && targets.length) submit(state.selected, targets[state.targetIndex]);
    } else {
      const commands = getCommands(activeId);
      if (direction) state.commandIndex = wrap(state.commandIndex + direction, commands.length);
      if (confirmPressed && commands.length) {
        state.selected = commands[state.commandIndex];
        const targets = getTargets(activeId, state.selected);
        if (targets.length) {
          state.phase = 'target';
          state.targetIndex = 0;
        } else submit(state.selected);
      }
    }
    render();
  });
  const stopRefresh = scene.lifecycle.on('refresh', render);
  const stopReady = scene.lifecycle.on('ready', runAi);
  scene.battlePresentation = state;
  return () => {
    stopTick();
    stopRefresh();
    stopReady();
    state.timer?.remove?.(false);
    menuText.destroy();
    if (scene.battlePresentation === state) delete scene.battlePresentation;
  };
}
