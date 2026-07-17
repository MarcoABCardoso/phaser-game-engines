import { EntityStore } from '@phaser-game-engines/core';
import { BASE_ENTITY_TYPES } from './registry.js';

/** Compatibility name for the shared world entity store. */
export default class EntityManager extends EntityStore {
  constructor(types = BASE_ENTITY_TYPES) { super(types); }
}
