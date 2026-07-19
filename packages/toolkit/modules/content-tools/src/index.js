import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { validateAssetManifest, validateLevel } from '@phaser-game-engines/toolkit/core';
import { validatePlatformerLevel } from '@phaser-game-engines/toolkit/platformer/headless';
import { BASE_ENTITY_TYPES as PLATFORMER_TYPES } from '@phaser-game-engines/toolkit/platformer/entities/registry.js';
import { validateTopDownLevel } from '@phaser-game-engines/toolkit/top-down/headless';
import { validateActionAdventureOptions } from '@phaser-game-engines/toolkit/top-down/headless';
import { BASE_ENTITY_TYPES as TOP_DOWN_TYPES } from '@phaser-game-engines/toolkit/top-down/entities/registry.js';

export const contentKinds = Object.freeze(['world', 'platformer', 'top-down', 'action-adventure', 'assets']);

/** Validate already-parsed content with the same contract used by scenes. */
export function validateContent(content, { kind = 'world', path = 'content', types = [] } = {}) {
  if (!contentKinds.includes(kind)) throw new TypeError(`Unknown content kind ${JSON.stringify(kind)}.`);
  const customTypes = Object.fromEntries(types.map((name) => [name, class CustomEntity {}]));
  if (kind === 'assets') return validateAssetManifest(content, { path });
  if (kind === 'action-adventure') return validateActionAdventureOptions(content, { path });
  if (kind === 'platformer') {
    return validatePlatformerLevel(content, { path, types: { ...PLATFORMER_TYPES, ...customTypes } });
  }
  if (kind === 'top-down') {
    return validateTopDownLevel(content, { path, types: { ...TOP_DOWN_TYPES, ...customTypes } });
  }
  return validateLevel(content, { path, types: types.length ? customTypes : undefined });
}

/** Read and validate one JSON file. Parse and validation errors include its path. */
export function validateContentFile(filename, options = {}) {
  const path = resolve(filename);
  const content = readJson(path);
  return validateContent(content, { ...options, path });
}

/** Normalize version markers without mutating the caller's content. */
export function migrateContent(content, { targetVersion = 1 } = {}) {
  if (targetVersion !== 1) throw new RangeError(`Unsupported content target version ${targetVersion}.`);
  const migrated = structuredClone(content);
  const fromVersion = migrated.schemaVersion ?? 1;
  if (fromVersion > targetVersion) {
    throw new RangeError(`Content version ${fromVersion} is newer than target version ${targetVersion}.`);
  }
  migrated.schemaVersion = targetVersion;
  if (Array.isArray(migrated.entitySpecs)) {
    for (const entity of migrated.entitySpecs) entity.schemaVersion ??= 1;
  }
  return { fromVersion, toVersion: targetVersion, changed: JSON.stringify(migrated) !== JSON.stringify(content), content: migrated };
}

/** Preview a migration by default; writing requires the explicit `write` option. */
export function migrateContentFile(filename, { write = false, ...options } = {}) {
  const path = resolve(filename);
  const result = migrateContent(readJson(path), options);
  if (write && result.changed) writeFileSync(path, `${JSON.stringify(result.content, null, 2)}\n`);
  return { ...result, path, written: Boolean(write && result.changed) };
}

function readJson(path) {
  let source;
  try { source = readFileSync(path, 'utf8'); } catch (error) {
    throw new Error(`${path}: ${error.message}`, { cause: error });
  }
  try { return JSON.parse(source); } catch (error) {
    throw new SyntaxError(`${path}: invalid JSON (${error.message})`, { cause: error });
  }
}
