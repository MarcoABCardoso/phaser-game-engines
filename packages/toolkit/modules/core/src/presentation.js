function assertFactoryMap(value, name) {
  if (value == null) return {};
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`Presentation ${name} must be an object of named factories.`);
  }
  for (const [key, factory] of Object.entries(value)) {
    if (!key || typeof factory !== 'function') {
      throw new TypeError(`Presentation ${name} ${JSON.stringify(key)} must be a function.`);
    }
  }
  return { ...value };
}

/** @typedef {{ root: any, body?: any, update?: (model: any) => void, destroy?: () => void }} PresentationDescriptor */
/** @typedef {(context: any) => object|PresentationDescriptor} PresentationFactory */
/** @typedef {{ prefabs?: Record<string, PresentationFactory>, presenters?: Record<string, PresentationFactory> }} PresentationDefinitions */
/** @typedef {Readonly<{ root: any, body: any, update(model: any): boolean, destroy(): boolean, readonly active: boolean }>} PresentationHandle */
/** @typedef {Readonly<{ createPrefab(name: string, props?: Record<string, any>, fallback?: PresentationFactory): PresentationHandle, present(name: string, props?: Record<string, any>, fallback?: PresentationFactory): PresentationHandle, hasPrefab(name: string): boolean, hasPresenter(name: string): boolean, clear(): void, readonly size: number }>} PresentationHost */

/** @returns {PresentationHandle} */
function normalizeHandle(value, release) {
  if ((typeof value !== 'object' && typeof value !== 'function') || value == null) {
    throw new TypeError('A presentation factory must return an object.');
  }
  const descriptor = Object.hasOwn(value, 'root') ? value : { root: value };
  const destroySource = typeof descriptor.destroy === 'function'
    ? () => descriptor.destroy()
    : () => descriptor.root?.destroy?.();
  let active = true;

  return Object.freeze({
    root: descriptor.root ?? null,
    body: descriptor.body ?? descriptor.root ?? null,
    update(model) {
      if (!active) return false;
      descriptor.update?.(model);
      return true;
    },
    destroy() {
      if (!active) return false;
      active = false;
      release();
      destroySource();
      return true;
    },
    get active() { return active; },
  });
}

/**
 * Create a renderer-neutral registry for world-object prefabs and composite presenters.
 * Factories receive `{ scene, ...props }` and return either a root object or a
 * `{ root, body?, update?, destroy? }` descriptor. Every returned handle is disposable.
 * @param {any} scene
 * @param {PresentationDefinitions} definitions
 * @returns {PresentationHost}
 */
export function createPresentationHost(scene, definitions = {}) {
  const prefabs = assertFactoryMap(definitions.prefabs, 'prefabs');
  const presenters = assertFactoryMap(definitions.presenters, 'presenters');
  const handles = new Set();

  const invoke = (kind, factories, name, props = {}, fallback) => {
    if (typeof name !== 'string' || !name) {
      throw new TypeError(`A ${kind} name must be a non-empty string.`);
    }
    const factory = factories[name] ?? fallback;
    if (typeof factory !== 'function') {
      throw new Error(`No ${kind} factory is registered for ${JSON.stringify(name)}.`);
    }
    let handle;
    const produced = factory({ ...props, scene });
    handle = normalizeHandle(produced, () => handles.delete(handle));
    handles.add(handle);
    return handle;
  };

  /** @type {PresentationHost} */
  const host = {
    createPrefab: (name, props = {}, fallback) => invoke('prefab', prefabs, name, props, fallback),
    present: (name, props = {}, fallback) => invoke('presenter', presenters, name, props, fallback),
    hasPrefab: (name) => Object.hasOwn(prefabs, name),
    hasPresenter: (name) => Object.hasOwn(presenters, name),
    clear() {
      const errors = [];
      for (const handle of [...handles].reverse()) {
        try { handle.destroy(); } catch (error) { errors.push(error); }
      }
      if (errors.length) throw new AggregateError(errors, 'Presentation cleanup failed.');
    },
    get size() { return handles.size; },
  };
  return Object.freeze(host);
}
