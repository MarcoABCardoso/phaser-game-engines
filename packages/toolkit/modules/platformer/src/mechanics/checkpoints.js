import { pointInRect } from '../systems/geometry.js';

/** Install checkpoint discovery and contextual activation over level-owned checkpoint data. */
export function createCheckpointMechanic(options = {}) {
  return function installCheckpoints(scene) {
    const controller = {
      current: null,
      revealed: new Set(),
      byId(id) { return (scene.level?.checkpoints ?? []).find((checkpoint) => checkpoint.id === id) ?? null; },
      isRevealed(checkpoint) {
        return options.isRevealed?.(checkpoint, scene, this)
          ?? (!checkpoint.hiddenUntilFlag || this.revealed.has(checkpoint.id));
      },
      isActive(checkpoint) { return options.isActive?.(checkpoint, scene, this) ?? false; },
      reveal(id) {
        this.revealed.add(id);
        options.onReveal?.(this.byId(id), scene, this);
      },
      findAt(x, y) {
        return (scene.level?.checkpoints ?? []).find(
          (checkpoint) => this.isRevealed(checkpoint) && pointInRect(x, y, checkpoint.zone),
        ) ?? null;
      },
      activate(checkpoint) { options.onActivate?.(checkpoint, scene, this); },
      rest(checkpoint) { options.onRest?.(checkpoint, scene, this); },
    };
    scene.platformerCheckpoints = controller;
    const stop = scene.lifecycle.on('beforeContextualActions', () => {
      const checkpoint = controller.findAt(scene.player.x, scene.player.y);
      controller.current = checkpoint;
      if (!checkpoint || options.isUsable?.(checkpoint, scene, controller) === false) return;
      const active = controller.isActive(checkpoint);
      options.onVisit?.(checkpoint, scene, controller);
      scene.offerContextualAction({
        id: `checkpoint:${active ? 'rest' : 'activate'}:${checkpoint.id}`,
        label: active
          ? (checkpoint.restLabel ?? options.restLabel ?? 'Rest')
          : (checkpoint.activateLabel ?? options.activateLabel ?? 'Activate checkpoint'),
        priority: checkpoint.interactionPriority ?? options.priority ?? 20,
        source: checkpoint,
        activation: active && (options.restHoldMs ?? 600) > 0
          ? { action: options.action ?? 'interact', mode: 'hold', durationMs: options.restHoldMs ?? 600 }
          : { action: options.action ?? 'interact', mode: 'press' },
        execute: () => active ? controller.rest(checkpoint) : controller.activate(checkpoint),
      });
    });
    return () => {
      stop();
      if (scene.platformerCheckpoints === controller) delete scene.platformerCheckpoints;
      options.onRemove?.(controller, scene);
    };
  };
}
