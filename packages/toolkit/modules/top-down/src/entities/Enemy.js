import Entity from './Entity.js';
import { boxesOverlap } from '../systems/geometry.js';

export default class Enemy extends Entity {
  static validateSpec(spec, { path, finite }) {
    finite(spec.x, `${path}.x`);
    finite(spec.y, `${path}.y`);
  }

  constructor(spec) {
    super(spec);
    this.capabilities.provide('targetable', {
      inRange: (scene) => this.inAttackRange(scene),
    });
    this.capabilities.provide('damageReceiver', {
      receive: ({ scene, amount }) => this.onHit(scene, amount),
    });
  }
  spawn(scene) {
    this.health = this.spec.health ?? 3;
    this.speed = this.spec.speed ?? 70;
    const w = this.spec.w ?? 20, h = this.spec.h ?? 20;
    // An explicit shape is always visible, even when the host has no assets loaded.
    this.sprite = scene.add.rectangle(this.spec.x, this.spec.y, w, h, this.spec.color ?? 0xd65d5d).setDepth(4);
    scene.physics.add.existing(this.sprite);
    this.sprite.body.setCircle(Math.min(w, h) / 2);
    this.collider = scene.physics.add.collider(this.sprite, scene.solids);
  }
  update(scene) {
    if (!this.sprite || this.health <= 0) return;
    const dx = scene.player.x - this.sprite.x, dy = scene.player.y - this.sprite.y, distance = Math.hypot(dx, dy);
    if (distance < (this.spec.chaseRange ?? 180) && distance > 1) this.sprite.body.setVelocity(dx / distance * this.speed, dy / distance * this.speed);
    else this.sprite.body.setVelocity(0, 0);
    if (boxesOverlap({ x: this.sprite.x, y: this.sprite.y, w: this.sprite.displayWidth, h: this.sprite.displayHeight }, { x: scene.player.x, y: scene.player.y, w: scene.player.displayWidth, h: scene.player.displayHeight })) scene.actionAdventure?.damagePlayer(this.spec.damage ?? 1, this.sprite);
  }
  inAttackRange(scene) { return this.sprite && Math.hypot(scene.player.x - this.sprite.x, scene.player.y - this.sprite.y) <= (this.spec.hitRange ?? 42); }
  onHit(scene, damage) {
    if ((this.health -= damage) > 0) return;
    scene.entities.despawn(scene, this);
    scene.actionAdventure?.onEnemyDefeated(this);
  }
  destroy(scene) {
    if (this.collider) scene?.physics?.world?.removeCollider(this.collider);
    this.collider = null;
    this.sprite?.destroy();
    this.sprite = null;
  }
}
