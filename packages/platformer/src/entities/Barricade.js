// Barricade.js — a breakable wall (the attack corridor's gate). An attackable
// surface: it opts into the shared attack loop and depletes hp per landed hit. It's
// a non-main obstacle, so it carries no goneFlag — every run rebuilds it fresh.
import Entity from './Entity.js';
import { pointInRect } from '../systems/geometry.js';

const COLOR = 0x8a5a3f;

export default class Barricade extends Entity {
  spawn(scene) {
    this.wall = this.spec.wall; // { x, y, w, h }
    this.maxHp = this.spec.hp;
    this.hp = this.spec.hp;
    this.broken = false;
    this.rect = scene.addSolid(this.wall, COLOR);
  }

  get attackable() {
    return !this.broken;
  }

  inAttackRange(scene) {
    if (this.broken) return false;
    // In reach horizontally (reach px past either edge) and roughly level with it.
    return pointInRect(scene.player.x, scene.player.y, this.wall, scene.attackReach, 10);
  }

  onHit(scene, damage) {
    this.hp -= damage;
    if (this.hp <= 0) {
      scene.solids.remove(this.rect, true, true);
      this.rect = null;
      this.broken = true;
    } else {
      // Fade toward transparent as it weakens, so damage reads visually.
      this.rect.setAlpha(Math.max(0.35, this.hp / this.maxHp));
    }
  }

  destroy(scene) {
    if (this.rect) {
      scene.solids.remove(this.rect, true, true);
      this.rect = null;
    }
  }
}
