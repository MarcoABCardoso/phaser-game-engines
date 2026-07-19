/** Install pit detection and an explicit failure/reset policy. */
export function createFailureMechanic(options = {}) {
  return function installFailure(scene) {
    const controller = {
      failed: false,
      reason: null,
      fail(reason, context = {}) {
        if (this.failed) return false;
        this.failed = true;
        this.reason = reason;
        scene.player?.body?.setVelocity?.(0, 0);
        scene.player?.body?.setAcceleration?.(0, 0);
        options.onFailure?.(reason, context, scene, this);
        if (options.autoResetMs !== false) {
          scene.time.delayedCall(options.autoResetMs ?? 900, () => this.reset());
        }
        return true;
      },
      reset() {
        options.onReset?.(scene, this);
        if (!options.onReset) {
          const spawn = options.getSpawn?.(scene, this) ?? scene.spawnPoint();
          scene.resetObstacles();
          scene.player.body.reset(spawn.x, spawn.y);
          scene.resetTransient();
        }
        this.failed = false;
        this.reason = null;
      },
    };
    scene.platformerFailure = controller;
    const removeGate = scene.addSimulationGate(() => controller.failed);
    const stop = scene.lifecycle.on('afterTraversal', () => {
      const killY = options.pitKillY?.(scene) ?? scene.level?.pitKillY;
      if (killY != null && scene.player.y > killY) {
        controller.fail(options.pitReason ?? 'The player fell out of the world.', { kind: 'pit' });
      }
    });
    return () => {
      stop();
      removeGate();
      if (scene.platformerFailure === controller) delete scene.platformerFailure;
      options.onRemove?.(controller, scene);
    };
  };
}
