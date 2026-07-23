import Phaser from 'phaser';
import './style.css';
import { audioDirector } from './presentation/audio-director.js';
import { installBrowserControls } from './input/controls.js';
import { campaign } from './state/campaign.js';
import { WorldScene } from './scenes/WorldScene.js';
import { EncounterScene } from './scenes/EncounterScene.js';
import { InventoryScene } from './scenes/InventoryScene.js';
import { JournalScene } from './scenes/JournalScene.js';
import { PauseScene } from './scenes/PauseScene.js';
import { ResultScene } from './scenes/ResultScene.js';
import { SettingsScene } from './scenes/SettingsScene.js';
import { TitleScene } from './scenes/TitleScene.js';

export const game = new Phaser.Game({
  type: Phaser.WEBGL,
  parent: 'game',
  width: 960,
  height: 540,
  backgroundColor: '#101827',
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 } } },
  input: { gamepad: true },
  scene: [TitleScene, WorldScene, EncounterScene, InventoryScene, PauseScene, JournalScene, SettingsScene, ResultScene],
});

window.addEventListener('pointerdown', () => audioDirector.resume(), { passive: true });
window.addEventListener('keydown', () => audioDirector.resume(), { passive: true });

installBrowserControls({
  restart: () => {
    for (const key of ['title', 'world', 'encounter', 'inventory', 'pause', 'journal', 'settings', 'result']) game.scene.stop(key);
    campaign.reset();
    game.scene.start('title');
  },
  action: () => {
    if (game.scene.isActive('title')) {
      game.scene.getScene('title').startNew();
      return;
    }
    if (game.scene.isActive('result')) {
      game.scene.getScene('result').continue();
      return;
    }
    if (game.scene.isActive('inventory')) {
      game.scene.getScene('inventory').activateSelected();
      return;
    }
    if (game.scene.isActive('encounter')) {
      game.scene.getScene('encounter').performAction();
      return;
    }
    if (!game.scene.isActive('world')) return;
    game.scene.getScene('world').performContextAction();
  },
  alternate: () => {
    if (game.scene.isActive('inventory')) {
      game.scene.getScene('inventory').close();
      return;
    }
    if (game.scene.isActive('world')) game.scene.getScene('world').chooseDialogueOption(1);
  },
  inventory: () => {
    if (game.scene.isActive('inventory')) {
      game.scene.getScene('inventory').close();
      return;
    }
    if (!game.scene.isActive('world')) return;
    const world = game.scene.getScene('world');
    world.scene.launch('inventory');
    world.scene.sleep();
  },
  menu: () => {
    if (game.scene.isActive('pause')) {
      game.scene.getScene('pause').resume();
      return;
    }
    if (!game.scene.isActive('world')) return;
    game.scene.getScene('world').scene.launch('pause');
    game.scene.getScene('world').scene.sleep();
  },
});
