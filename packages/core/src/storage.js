/** @typedef {{ read(key: string): string|null, write(key: string, value: string): void, remove(key: string): unknown, list(prefix?: string): string[] }} StorageAdapter */

/** In-memory storage adapter for tests, server tools, and ephemeral sessions. */
export function createMemoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return Object.freeze({
    read: (key) => values.get(key) ?? null,
    write: (key, value) => { values.set(key, value); },
    remove: (key) => values.delete(key),
    list: (prefix = '') => [...values.keys()].filter((key) => key.startsWith(prefix)).sort(),
  });
}

/** Browser localStorage adapter, injected for testability. */
export function createLocalStorageAdapter(storage = globalThis.localStorage) {
  if (!storage) throw new Error('localStorage is unavailable.');
  return Object.freeze({
    read: (key) => storage.getItem(key),
    write: (key, value) => storage.setItem(key, value),
    remove: (key) => storage.removeItem(key),
    list: (prefix = '') => Array.from({ length: storage.length }, (_, index) => storage.key(index))
      .filter((key) => key?.startsWith(prefix)).sort(),
  });
}

/** Version-aware save slots with a staging write and recoverable load failures.
 * @param {{ storage: StorageAdapter, prefix?: string, codec?: { serialize(source: unknown): unknown, deserialize(snapshot: unknown, target?: unknown): unknown } }} options
 */
export function createSaveStore({ storage, prefix = 'pge:save:', codec } = {}) {
  if (!storage || typeof storage.read !== 'function' || typeof storage.write !== 'function') {
    throw new TypeError('A storage adapter with read/write is required.');
  }
  const keyFor = (slot) => `${prefix}${slot}`;
  return Object.freeze({
    save(slot, source) {
      const serialized = codec ? codec.serialize(source) : source;
      const text = JSON.stringify(serialized);
      const key = keyFor(slot);
      const staging = `${key}:staging`;
      storage.write(staging, text);
      storage.write(key, text);
      storage.remove(staging);
      return serialized;
    },
    load(slot, target) {
      const raw = storage.read(keyFor(slot));
      if (raw == null) return { ok: false, reason: 'missing', value: null };
      try {
        const parsed = JSON.parse(raw);
        return { ok: true, value: codec ? codec.deserialize(parsed, target) : parsed };
      } catch (error) {
        return { ok: false, reason: 'invalid-or-unmigratable', error, recovery: { raw } };
      }
    },
    remove(slot) { return storage.remove(keyFor(slot)); },
    slots() {
      return storage.list(prefix)
        .filter((key) => !key.endsWith(':staging'))
        .map((key) => key.slice(prefix.length));
    },
  });
}
