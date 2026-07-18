/** Replace selected traversal providers for the lifetime of a recipe. */
export function createTraversalTuningMechanic(options = {}) {
  const providers = {
    jumpVelocity: 'jumpVelocity',
    maxSpeed: 'moveMaxSpeed',
    acceleration: 'moveAccel',
    groundDrag: 'groundDragX',
    airDrag: 'airDragX',
    airJumps: 'airJumpCount',
    coyoteMs: 'coyoteMs',
    jumpBufferMs: 'jumpBufferMs',
    fastFallGravity: 'fastFallGravity',
    dash: 'dashConfig',
    wall: 'wallSlideConfig',
    ledge: 'ledgeGrabConfig',
  };
  return function installTraversalTuning(scene) {
    const previous = new Map();
    for (const [option, method] of Object.entries(providers)) {
      if (options[option] === undefined) continue;
      previous.set(method, scene[method]);
      scene[method] = () => options[option];
    }
    return () => {
      for (const [method, implementation] of previous) scene[method] = implementation;
    };
  };
}
