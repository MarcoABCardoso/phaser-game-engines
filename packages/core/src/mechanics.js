import { runCleanups } from './resources.js';

/**
 * Install and remove opt-in mechanics without assigning their state schema to a host.
 * A mechanic is a function `(host) => cleanup` or an object with `install(host)`.
 */
export function createMechanicHost(host) {
  const installed = new Map();

  function install(mechanic) {
    if (!mechanic) throw new TypeError('A mechanic is required.');
    if (installed.has(mechanic)) return installed.get(mechanic).remove;
    const installer = typeof mechanic === 'function' ? mechanic : mechanic.install;
    if (typeof installer !== 'function') {
      throw new TypeError('A mechanic must be a function or expose install(host).');
    }

    let active = true;
    const cleanup = installer.call(mechanic, host);
    if (cleanup !== undefined && typeof cleanup !== 'function') {
      throw new TypeError('A mechanic installer must return a cleanup function or undefined.');
    }
    const record = {
      remove() {
        if (!active) return false;
        active = false;
        installed.delete(mechanic);
        cleanup?.();
        return true;
      },
    };
    installed.set(mechanic, record);
    return record.remove;
  }

  function remove(mechanic) {
    return installed.get(mechanic)?.remove() ?? false;
  }

  function clear() {
    runCleanups(
      [...installed.values()].reverse().map((record) => record.remove),
      'One or more mechanics failed to clean up.',
    );
  }

  function has(mechanic) {
    return installed.has(mechanic);
  }

  return Object.freeze({ install, remove, clear, has });
}
