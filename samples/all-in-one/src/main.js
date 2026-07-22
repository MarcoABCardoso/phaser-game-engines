import Phaser from 'phaser';
import './style.css';
import { installBrowserControls } from './input/controls.js';
import { campaign } from './state/campaign.js';
import { WorldScene } from './scenes/WorldScene.js';
import { EncounterScene } from './scenes/EncounterScene.js';
import { InventoryScene } from './scenes/InventoryScene.js';

const game = new Phaser.Game({
  type: Phaser.WEBGL,
  parent: 'game',
  width: 960,
  height: 540,
  backgroundColor: '#101827',
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 } } },
  input: { gamepad: true },
  scene: [WorldScene, EncounterScene, InventoryScene],
});

installBrowserControls({
  restart: () => {
    for (const key of ['world', 'encounter', 'inventory']) game.scene.stop(key);
    campaign.reset();
    game.scene.start('world');
  },
  action: () => {
    if (game.scene.isActive('encounter')) {
      game.scene.getScene('encounter').performAction();
      return;
    }
    const world = game.scene.getScene('world');
    const encounter = world.entities?.get('training-drone');
    if (encounter) world.requestEncounter(encounter);
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
});
