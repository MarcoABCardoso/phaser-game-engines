const clone = (value) => value === undefined ? undefined : structuredClone(value);

function captureComponent(component) {
  if (typeof component === 'function') return component();
  if (typeof component?.snapshot === 'function') return component.snapshot();
  if (typeof component?.getState === 'function') return component.getState();
  return clone(component);
}

/** Capture only explicitly registered, JSON-friendly game/session components. */
export function captureSessionSnapshot(components, { version = 1, metadata = {} } = {}) {
  const data = {};
  for (const [name, component] of Object.entries(components ?? {})) {
    data[name] = clone(captureComponent(component));
  }
  return { version, metadata: clone(metadata), components: data };
}

/** Restore explicit components; Phaser objects are never traversed or serialized. */
export function restoreSessionSnapshot(snapshot, components, { migrations = {}, version = 1 } = {}) {
  if (!snapshot || !Number.isInteger(snapshot.version) || !snapshot.components) {
    throw new TypeError('Expected a versioned session snapshot.');
  }
  if (snapshot.version > version) throw new Error(`Session snapshot ${snapshot.version} is newer than ${version}.`);
  let current = snapshot.version;
  let data = clone(snapshot.components);
  while (current < version) {
    if (typeof migrations[current] !== 'function') throw new Error(`Missing session migration from version ${current}.`);
    data = migrations[current](data);
    current += 1;
  }
  for (const [name, value] of Object.entries(data)) {
    const target = components?.[name];
    if (typeof target === 'function') target(clone(value));
    else if (typeof target?.restore === 'function') target.restore(clone(value));
    else if (typeof target?.setState === 'function') target.setState(clone(value));
  }
  return data;
}

/** Build a deterministic bug-report envelope. Game state is excluded unless supplied. */
export function createBugReportBundle({ engineVersions = {}, contentVersions = {}, seed, recording, checkpoints, gameData } = {}) {
  const bundle = {
    version: 1,
    engineVersions: clone(engineVersions),
    contentVersions: clone(contentVersions),
    seed: clone(seed),
    recording: clone(recording),
    checkpoints: clone(checkpoints),
  };
  if (gameData !== undefined) bundle.gameData = clone(gameData);
  return bundle;
}
