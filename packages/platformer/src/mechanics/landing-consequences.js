/** Install game-defined consequences for the scene's schema-free landing facts. */
export function createLandingConsequenceMechanic({ resolve = (fact) => fact, apply } = {}) {
  if (typeof apply !== 'function') throw new TypeError('A landing consequence requires apply(result, context).');
  return function installLandingConsequences(scene) {
    return scene.lifecycle.on('landing', (fact) => {
      const result = resolve({ drop: fact.drop, impactVelocity: fact.impactVelocity });
      if (result !== undefined && result !== null && result !== false) {
        apply(result, { scene, fact });
      }
    });
  };
}
