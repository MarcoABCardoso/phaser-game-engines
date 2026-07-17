// Gate.js — a full-height wall that blocks travel until a named checkpoint is lit. It
// reads the checkpoint's lit-state in spawn(), so once it's lit (which the game persists)
// the gate rebuilds already-open on every future run; within the run, it watches for the
// checkpoint being lit and grinds open the moment it is. It's a non-main obstacle keyed to
// a persistent lit-state, not a goneFlag, so it carries no objective flag. Lit-state is
// asked of the scene (scene.isCheckpointLit) — a generic checkpoint query the game answers
// — so this stays engine code with no game import.
import Entity from './Entity.js';

const COLOR = 0xc9873f;

export default class Gate extends Entity {
  static validateSpec(spec, { path, validateRect }) {
    validateRect(spec.rect, { path: `${path}.rect` });
  }

  spawn(scene) {
    this.rect = null;
    this.checkpoint = scene.checkpointById(this.spec.beaconId);
    if (this.isOpen(scene)) return; // checkpoint already lit — rebuild open
    this.rect = scene.addSolid(this.spec.rect, COLOR);
    this.rect.setDepth(15);
  }

  isOpen(scene) {
    return this.checkpoint ? scene.isCheckpointLit(this.checkpoint) : true;
  }

  update(scene) {
    // Opens as soon as its checkpoint is lit this run (lighting it clears the way).
    if (this.rect && this.isOpen(scene)) this.open(scene);
  }

  open(scene) {
    if (!this.rect) return;
    scene.solids.remove(this.rect, true, true);
    this.rect = null;
  }

  destroy(scene) {
    if (this.rect) {
      scene.solids.remove(this.rect, true, true);
      this.rect = null;
    }
  }
}
