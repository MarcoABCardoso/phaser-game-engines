/** Versioned snapshot envelope with explicit, sequential migrations. */
export function createSnapshotCodec({ version = 1, capture, restore, migrations = {} } = {}) {
  if (!Number.isInteger(version) || version < 1) throw new TypeError('Snapshot version must be a positive integer.');
  if (capture !== undefined && typeof capture !== 'function') throw new TypeError('capture must be a function.');
  if (restore !== undefined && typeof restore !== 'function') throw new TypeError('restore must be a function.');

  function serialize(source) {
    if (!capture) throw new Error('This snapshot codec has no capture function.');
    return { version, data: capture(source) };
  }

  function deserialize(snapshot, target) {
    if (!snapshot || !Number.isInteger(snapshot.version) || snapshot.version < 1 || !('data' in snapshot)) {
      throw new TypeError('snapshot: expected { version, data }.');
    }
    if (snapshot.version > version) throw new Error(`snapshot.version: ${snapshot.version} is newer than supported version ${version}.`);
    let current = snapshot.version;
    let data = snapshot.data;
    while (current < version) {
      const migrate = migrations[current];
      if (typeof migrate !== 'function') throw new Error(`snapshot.version: missing migration from version ${current}.`);
      data = migrate(data);
      current += 1;
    }
    return restore ? restore(data, target) : data;
  }

  return Object.freeze({ version, serialize, deserialize });
}
