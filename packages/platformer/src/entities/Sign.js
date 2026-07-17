// Sign.js — a readable world fixture. It's a static post the player can read by
// pressing the interact key while standing near it; reading opens a conversation (the
// dialogue box freezes the world), which is why a sign is an Entity like anything else
// rather than a scene special-case. No physics, no goneFlag: it never blocks travel and
// rebuilds identically each run. Which lines it shows is data — `spec.dialogId`.
import Entity from './Entity.js';
import { pointInRect } from '../systems/geometry.js';

const COLOR = 0x8a7a4a;
const POST_COLOR = 0x5a4a30;

export default class Sign extends Entity {
  static validateSpec(spec, { path, validateRect }) {
    validateRect(spec.zone, { path: `${path}.zone` });
    validateRect(spec.board, { path: `${path}.board` });
    validateRect(spec.post, { path: `${path}.post` });
  }

  constructor(spec) {
    super(spec);
    this.capabilities.provide('interactable', {
      label: spec.label ?? 'Read sign',
    });
  }

  spawn(scene) {
    const b = this.spec.board; // { x, y, w, h } — the drawn board
    const p = this.spec.post; // { x, y, w, h } — the drawn post beneath it
    this.post = scene.add.rectangle(p.x + p.w / 2, p.y + p.h / 2, p.w, p.h, POST_COLOR).setDepth(17);
    this.board = scene.add.rectangle(b.x + b.w / 2, b.y + b.h / 2, b.w, b.h, COLOR).setDepth(17);
    this.glyph = scene.add
      .text(b.x + b.w / 2, b.y + b.h / 2, '?', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#1a140a',
      })
      .setOrigin(0.5)
      .setDepth(18);
  }

  update(scene) {
    if (!pointInRect(scene.player.x, scene.player.y, this.spec.zone)) return;
    scene.offerContextualAction({
      id: `read:${this.id}`,
      kind: 'readable',
      label: this.spec.label ?? 'Read sign',
      priority: this.spec.priority ?? 0,
      source: this,
      available: () => !scene.dialogActive,
      execute: () => scene.startDialog(this.spec.dialogId),
    });
  }

  destroy() {
    for (const o of [this.post, this.board, this.glyph]) if (o) o.destroy();
    this.post = this.board = this.glyph = null;
  }
}
