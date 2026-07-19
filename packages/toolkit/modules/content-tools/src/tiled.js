import { validatePlatformerLevel } from '@phaser-game-engines/toolkit/platformer/headless';
import { BASE_ENTITY_TYPES as PLATFORMER_TYPES } from '@phaser-game-engines/toolkit/platformer/entities/registry.js';
import { validateTopDownLevel } from '@phaser-game-engines/toolkit/top-down/headless';
import { BASE_ENTITY_TYPES as TOP_DOWN_TYPES } from '@phaser-game-engines/toolkit/top-down/entities/registry.js';

/** Convert a deliberately small Tiled object-layer convention into runtime level data. */
export function convertTiledMap(map, { kind, path = 'tiled', types = [], validate = true } = {}) {
  if (!['platformer', 'top-down'].includes(kind)) throw new TypeError('Tiled conversion kind must be platformer or top-down.');
  assertMap(map, path);
  const roles = new Map();
  for (const [index, layer] of map.layers.entries()) {
    if (layer.type !== 'objectgroup') continue;
    const role = propertyMap(layer.properties).engineRole ?? layer.name;
    if (roles.has(role)) throw new TypeError(`${path}.layers[${index}]: duplicate engine role ${JSON.stringify(role)}.`);
    roles.set(role, { ...layer, path: `${path}.layers[${index}]` });
  }
  const spawnObject = objects(roles.get('spawn'))[0];
  if (!spawnObject) throw new TypeError(`${path}.layers: missing an object layer with engineRole "spawn".`);
  const entitiesLayer = roles.get('entities');
  const level = {
    schemaVersion: 1,
    world: { width: map.width * map.tilewidth, height: map.height * map.tileheight },
    spawn: { x: number(spawnObject.x, `${path}.spawn.x`), y: number(spawnObject.y, `${path}.spawn.y`) },
    entitySpecs: objects(entitiesLayer).map((object, index) => entitySpec(object, `${entitiesLayer?.path ?? `${path}.entities`}.objects[${index}]`)),
  };
  const solidsLayer = roles.get('solids');
  const solids = objects(solidsLayer).map((object, index) => rect(object, `${solidsLayer?.path}.objects[${index}]`));
  if (kind === 'platformer') {
    const platformsLayer = roles.get('platforms');
    level.floorSegments = solids;
    level.platforms = objects(platformsLayer).map((object, index) => ({
      ...rect(object, `${platformsLayer?.path}.objects[${index}]`),
      ...propertyMap(object.properties),
      ...(object.name ? { id: object.name } : {}),
    }));
  } else level.walls = solids;

  if (validate) {
    const custom = Object.fromEntries(types.map((name) => [name, class CustomEntity {}]));
    if (kind === 'platformer') validatePlatformerLevel(level, { path: `${path}.converted`, types: { ...PLATFORMER_TYPES, ...custom } });
    else validateTopDownLevel(level, { path: `${path}.converted`, types: { ...TOP_DOWN_TYPES, ...custom } });
  }
  return level;
}

function entitySpec(object, path) {
  const properties = propertyMap(object.properties);
  const type = properties.type ?? object.class ?? object.type;
  if (typeof type !== 'string' || !type) throw new TypeError(`${path}.type: expected a Tiled class/type or custom property.`);
  const spec = {
    schemaVersion: 1, type, ...(object.name ? { id: object.name } : {}),
    x: number(object.x ?? 0, `${path}.x`), y: number(object.y ?? 0, `${path}.y`),
    ...(Number(object.width) > 0 && Number(object.height) > 0 ? { zone: rect(object, path) } : {}),
    ...properties,
  };
  spec.type = type;
  if (properties.entryX !== undefined || properties.entryY !== undefined) {
    spec.entry = { x: number(properties.entryX ?? 0, `${path}.entryX`), y: number(properties.entryY ?? 0, `${path}.entryY`) };
    delete spec.entryX;
    delete spec.entryY;
  }
  if (properties.markerX !== undefined || properties.markerY !== undefined || properties.markerLabel !== undefined) {
    spec.marker = {
      x: number(properties.markerX ?? spec.x, `${path}.markerX`),
      y: number(properties.markerY ?? spec.y, `${path}.markerY`),
      ...(properties.markerLabel !== undefined ? { label: String(properties.markerLabel) } : {}),
    };
    delete spec.markerX;
    delete spec.markerY;
    delete spec.markerLabel;
  }
  return spec;
}

function assertMap(map, path) {
  if (!map || typeof map !== 'object' || Array.isArray(map)) throw new TypeError(`${path}: expected a Tiled map object.`);
  for (const field of ['width', 'height', 'tilewidth', 'tileheight']) number(map[field], `${path}.${field}`, true);
  if (!Array.isArray(map.layers)) throw new TypeError(`${path}.layers: expected an array.`);
}
function rect(object, path) {
  return { x: number(object.x, `${path}.x`), y: number(object.y, `${path}.y`), w: number(object.width, `${path}.width`, true), h: number(object.height, `${path}.height`, true) };
}
function number(value, path, positive = false) {
  if (!Number.isFinite(value) || (positive && value <= 0)) throw new TypeError(`${path}: expected ${positive ? 'a positive ' : 'a '}finite number.`);
  return value;
}
function objects(layer) {
  if (!layer) return [];
  if (!Array.isArray(layer.objects)) throw new TypeError(`${layer.path}.objects: expected an array.`);
  return layer.objects;
}
function propertyMap(properties = []) {
  if (!Array.isArray(properties)) return {};
  return Object.fromEntries(properties.map((property) => [property.name, property.value]));
}
