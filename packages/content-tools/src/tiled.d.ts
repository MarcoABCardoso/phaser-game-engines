import type { PlatformerLevel } from '@phaser-game-engines/platformer/systems/content.js';
import type { TopDownLevel } from '@phaser-game-engines/top-down/systems/content.js';
export interface TiledProperty { name: string; type?: string; value: unknown }
export interface TiledObject { id?: number; name?: string; type?: string; class?: string; x: number; y: number; width?: number; height?: number; properties?: TiledProperty[] }
export interface TiledObjectLayer { name: string; type: 'objectgroup'; objects: TiledObject[]; properties?: TiledProperty[] }
export interface TiledMap { width: number; height: number; tilewidth: number; tileheight: number; layers: Array<TiledObjectLayer | Record<string, unknown>> }
export function convertTiledMap(map: TiledMap, options: { kind: 'platformer'; path?: string; types?: string[]; validate?: boolean }): PlatformerLevel;
export function convertTiledMap(map: TiledMap, options: { kind: 'top-down'; path?: string; types?: string[]; validate?: boolean }): TopDownLevel;

