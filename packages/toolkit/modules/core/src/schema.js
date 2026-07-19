export const WORLD_SCHEMA_VERSION = 1;
export const ENTITY_SCHEMA_VERSION = 1;

export class ContentValidationError extends TypeError {
  constructor(path, message) {
    super(`${path}: ${message}`);
    this.name = 'ContentValidationError';
    this.path = path;
  }
}

function fail(path, message) { throw new ContentValidationError(path, message); }
function object(value, path) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(path, 'expected an object.');
}
function finite(value, path, { positive = false } = {}) {
  if (!Number.isFinite(value) || (positive && value <= 0)) {
    fail(path, positive ? 'expected a positive finite number.' : 'expected a finite number.');
  }
}
function version(value, expected, path) {
  const actual = value ?? expected;
  if (actual !== expected) fail(path, `unsupported schema version ${JSON.stringify(actual)}; expected ${expected}.`);
}

export function validateRect(rect, { path = 'rect', positiveSize = true } = {}) {
  object(rect, path);
  finite(rect.x, `${path}.x`);
  finite(rect.y, `${path}.y`);
  finite(rect.w, `${path}.w`, { positive: positiveSize });
  finite(rect.h, `${path}.h`, { positive: positiveSize });
  return rect;
}

export function validatePortalSpec(spec, { path = 'entity', fail: report = fail } = {}) {
  validateRect(spec.zone, { path: `${path}.zone` });
  if (typeof spec.to !== 'string' || !spec.to) report(`${path}.to`, 'expected a non-empty string.');
  return spec;
}

export function validateEntitySpec(spec, { path = 'entity', types } = {}) {
  object(spec, path);
  version(spec.schemaVersion, ENTITY_SCHEMA_VERSION, `${path}.schemaVersion`);
  if (typeof spec.type !== 'string' || !spec.type) fail(`${path}.type`, 'expected a non-empty string.');
  if (types && !(typeof types.has === 'function' ? types.has(spec.type) : spec.type in types)) {
    fail(`${path}.type`, `unknown entity type ${JSON.stringify(spec.type)}.`);
  }
  if (spec.id !== undefined && (typeof spec.id !== 'string' || !spec.id)) {
    fail(`${path}.id`, 'expected a non-empty string when provided.');
  }
  const EntityType = types && (typeof types.get === 'function' ? types.get(spec.type) : types[spec.type]);
  EntityType?.validateSpec?.(spec, { path, fail, finite, object, validateRect });
  return spec;
}

export function validateLevel(level, { path = 'level', types, validateExtension } = {}) {
  object(level, path);
  version(level.schemaVersion, WORLD_SCHEMA_VERSION, `${path}.schemaVersion`);
  object(level.world, `${path}.world`);
  finite(level.world.width, `${path}.world.width`, { positive: true });
  finite(level.world.height, `${path}.world.height`, { positive: true });
  object(level.spawn, `${path}.spawn`);
  finite(level.spawn.x, `${path}.spawn.x`);
  finite(level.spawn.y, `${path}.spawn.y`);
  if (level.entitySpecs !== undefined && !Array.isArray(level.entitySpecs)) {
    fail(`${path}.entitySpecs`, 'expected an array.');
  }
  for (const [index, spec] of (level.entitySpecs ?? []).entries()) {
    validateEntitySpec(spec, { path: `${path}.entitySpecs[${index}]`, types });
  }
  validateExtension?.(level, { path, fail, finite, object });
  return level;
}
