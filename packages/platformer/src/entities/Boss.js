// Boss.js — the attack arena's boss: an enemy that's inert AND unseen until it's armed
// (the artifact inside its arena is grabbed — see arm()), then it appears, seals the way
// behind the player, chases within its bounds, and trades hits. It's both an attackable
// surface (while awake) and an autonomous actor, and it owns the arena gate it raises.
// Defeating it is a main objective, so it carries a goneFlag — once that's banked it
// rebuilds already-gone.
import Entity from './Entity.js';
import { boxesOverlap } from '../systems/geometry.js';

const COLOR = 0xd6455c;
const GATE_COLOR = 0x2a1420;

const INVINCIBLE_MS = 900; // player i-frames after a hit, so contact can't chain-stun
const STUN_MS = 250; // player movement stun after a hit
const KNOCKBACK_MS = 220; // window where chase AI yields to the boss's own hit-knockback
const HIT_KNOCKBACK = 260; // boss horizontal knockback from a landed player hit

export default class Boss extends Entity {
  spawn(scene) {
    this.arena = this.spec.arena;
    this.hp = this.spec.hp;
    this.active = false;
    this.knockbackUntil = 0;
    this.gateRect = null;
    this.collider = null;
    this.rect = null;
    // Permanently defeated (banked): rebuild with no body at all.
    if (this.isGone(scene.save)) return;

    const b = this.spec;
    this.rect = scene.add.rectangle(b.spawn.x, b.spawn.y, b.w, b.h, COLOR).setDepth(45);
    scene.physics.add.existing(this.rect);
    this.rect.body.setCollideWorldBounds(true);
    this.rect.body.setDragX(900);
    this.collider = scene.physics.add.collider(this.rect, scene.solids);
    this.rect.body.reset(b.spawn.x, b.spawn.y);
    // Hidden until armed: the body exists (so the fight is ready to snap on) but the boss
    // isn't seen standing in the arena before the fight. arm() reveals it.
    this.rect.setVisible(false);
  }

  // Spring the fight: called the instant the artifact is grabbed (Artifact.update),
  // NOT off the player's position. Reveals the boss, seals the arena gate behind the
  // player, and switches it live. The intro line is played by the caller, sequenced
  // after the pickup line, so both beats land in order.
  arm(scene) {
    if (!this.rect || this.active) return;
    this.active = true;
    this.rect.setVisible(true);
    this.armGate(scene);
  }

  get alive() {
    return Boolean(this.rect);
  }

  get attackable() {
    return this.alive && this.active;
  }

  inAttackRange(scene) {
    if (!this.attackable) return false;
    const dx = Math.abs(scene.player.x - this.rect.x);
    const dy = Math.abs(scene.player.y - this.rect.y);
    return (
      dx <= scene.attackReach + this.spec.w / 2 &&
      dy <= (this.spec.h + scene.player.body.height) / 2
    );
  }

  onHit(scene, damage) {
    this.hp -= damage;
    const dir = Math.sign(this.rect.x - scene.player.x) || 1;
    this.rect.body.setVelocityX(dir * HIT_KNOCKBACK);
    this.knockbackUntil = scene.time.now + KNOCKBACK_MS;
    if (this.hp <= 0) this.kill(scene);
  }

  update(scene, time) {
    if (!this.rect) return;
    const arena = this.arena;
    const px = scene.player.x;

    // Inert (and hidden) until armed by the artifact pickup — see arm(). No position
    // check: the boss never wakes just because the player walked to a line.
    if (!this.active) return;

    // Chase, but don't let the chase steer the boss past its soft bounds (the world
    // edge and the solid gate contain it for real; this just stops the AI pushing
    // outward once it's already there).
    if (time >= this.knockbackUntil) {
      let dir = Math.sign(px - this.rect.x) || 1;
      if (this.rect.x <= arena.xMin && dir < 0) dir = 0;
      if (this.rect.x >= arena.xMax && dir > 0) dir = 0;
      this.rect.body.setVelocityX(dir * this.spec.speed);
    }

    const hitting = boxesOverlap(
      px,
      scene.player.y,
      scene.player.body.width,
      scene.player.body.height,
      this.rect.x,
      this.rect.y,
      this.spec.w,
      this.spec.h,
    );
    // Contact damage — but only when the player isn't already in i-frames, so a
    // single touch can't chain-stun. The reaction (i-frames, stun, knockback, flash,
    // flinch) is the shared player-hurt path; the boss just supplies its knobs.
    if (hitting && !scene.isPlayerInvincible(time)) {
      scene.hurtPlayer({
        damage: this.spec.contactDamage,
        fromX: this.rect.x,
        invincibleMs: INVINCIBLE_MS,
        stunMs: STUN_MS,
      });
    }
  }

  armGate(scene) {
    // The gate materializing behind the player (and the warden's dialogue) is the
    // telegraph — no toast.
    this.gateRect = scene.addSolid(this.arena.gate, GATE_COLOR);
  }

  openGate(scene) {
    if (!this.gateRect) return;
    scene.solids.remove(this.gateRect, true, true);
    this.gateRect = null;
  }

  kill(scene) {
    this.rect.destroy();
    this.rect = null;
    this.active = false;
    this.openGate(scene);
    // Completing the objective is an unbanked gain (the game decides what that means —
    // here it becomes a pending bank). Some arenas also reveal a hidden checkpoint on the
    // kill; the demo's boss doesn't, so both are optional. Both go through generic scene
    // seams, so the boss carries no game-rule knowledge.
    scene.objectiveGained(this.goneFlag, 'The boss stays down — for good.');
    if (this.spec.revealCheckpointId) {
      scene.revealCheckpointThisRun(this.spec.revealCheckpointId);
      const cp = scene.checkpointById(this.spec.revealCheckpointId);
      if (cp) scene.refreshCheckpointVisual(cp);
    }
    if (this.spec.defeatDialog) scene.startDialog(this.spec.defeatDialog);
  }

  destroy(scene) {
    if (this.collider) {
      scene.physics.world.removeCollider(this.collider);
      this.collider = null;
    }
    this.openGate(scene);
    if (this.rect) {
      this.rect.destroy();
      this.rect = null;
    }
  }
}
