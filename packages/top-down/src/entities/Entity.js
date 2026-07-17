export default class Entity {
  constructor(spec = {}) { this.id = spec.id; this.spec = spec; }
  get goneFlag() { return this.spec.goneFlag ?? null; }
  isGone(save) { return Boolean(this.goneFlag && save.flags[this.goneFlag]); }
  get attackable() { return false; }
  inAttackRange() { return false; }
  onHit() {}
  spawn() {}
  update() {}
  destroy() {}
}
