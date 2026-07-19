function assertName(name) {
  if (typeof name !== 'string' || !name) {
    throw new TypeError('A capability name must be a non-empty string.');
  }
}

/**
 * A small, schema-free capability bag.
 *
 * Capability values are deliberately opaque: a game may expose a function, an
 * adapter object, or plain data. Genre packages only query names they actually use.
 */
export function createCapabilities(initial = {}) {
  const values = new Map();

  function provide(name, value = true) {
    assertName(name);
    values.set(name, value);
    return () => remove(name, value);
  }

  function remove(name, expectedValue) {
    assertName(name);
    if (!values.has(name)) return false;
    if (arguments.length > 1 && values.get(name) !== expectedValue) return false;
    return values.delete(name);
  }

  function has(name) {
    assertName(name);
    return values.has(name);
  }

  function get(name) {
    assertName(name);
    return values.get(name);
  }

  function entries() {
    return [...values.entries()];
  }

  for (const [name, value] of Object.entries(initial ?? {})) provide(name, value);
  return Object.freeze({ provide, remove, has, get, entries });
}

/** Read a capability from either a capability bag or a plain capability object. */
export function getCapability(provider, name) {
  if (!provider) return undefined;
  const capabilities = provider.capabilities ?? provider;
  if (typeof capabilities.get === 'function') return capabilities.get(name);
  return Object.prototype.hasOwnProperty.call(capabilities, name)
    ? capabilities[name]
    : undefined;
}

export function hasCapability(provider, name) {
  if (!provider) return false;
  const capabilities = provider.capabilities ?? provider;
  if (typeof capabilities.has === 'function') return capabilities.has(name);
  return Object.prototype.hasOwnProperty.call(capabilities, name);
}
