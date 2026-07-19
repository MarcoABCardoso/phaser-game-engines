/** Run every cleanup even when earlier callbacks fail. */
export function runCleanups(cleanups, message = 'One or more cleanup operations failed.') {
  const errors = [];
  for (const cleanup of cleanups) {
    try { cleanup?.(); } catch (error) { errors.push(error); }
  }
  if (errors.length) throw new AggregateError(errors, message);
}

/** Own cleanup callbacks for listeners, bodies, timers, and other external resources. */
export function createResourceScope() {
  const cleanups = [];
  let closed = false;

  function own(resource, cleanup) {
    if (closed) throw new Error('Cannot add a resource to a closed scope.');
    const dispose = cleanup ?? (typeof resource === 'function' ? resource : resource?.destroy?.bind(resource));
    if (typeof dispose !== 'function') {
      throw new TypeError('A resource requires a cleanup function or destroy() method.');
    }
    let active = true;
    const release = () => {
      if (!active) return false;
      active = false;
      const index = cleanups.indexOf(release);
      if (index !== -1) cleanups.splice(index, 1);
      dispose(resource);
      return true;
    };
    cleanups.push(release);
    return release;
  }

  function clear() {
    if (closed) return false;
    closed = true;
    const releases = cleanups.slice().reverse();
    cleanups.length = 0;
    runCleanups(releases, 'One or more world resources failed to clean up.');
    return true;
  }

  return Object.freeze({ own, clear, get closed() { return closed; }, get size() { return cleanups.length; } });
}
