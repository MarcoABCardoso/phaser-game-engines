import type Phaser from 'phaser';

export type ItemLocation = { kind: 'item'; index: number };
export type EquipmentLocation = { kind: 'equipment'; slot: string };
export type InventoryLocation = ItemLocation | EquipmentLocation;
export interface InventoryState<Item = unknown> { items: (Item | null)[]; equipment: Record<string, Item | null> }
export interface InventoryEvent<Item = unknown> {
  type: 'added' | 'removed' | 'moved' | 'sorted' | 'used';
  state: InventoryState<Item>;
  item?: Item;
  displaced?: Item | null;
  location?: InventoryLocation;
  from?: InventoryLocation;
  to?: InventoryLocation;
  result?: unknown;
}
export interface InventoryRules<Item = unknown, Context = unknown> {
  canEquip?(item: Item, slot: string, detail: { inventory: Inventory<Item, Context>; from: InventoryLocation }): boolean;
  canUse?(item: Item, detail: { inventory: Inventory<Item, Context>; location: InventoryLocation; context: Context }): boolean;
  useItem?(item: Item, detail: { inventory: Inventory<Item, Context>; location: InventoryLocation; context: Context }): unknown;
}
export interface InventorySpec<Item = unknown> {
  itemSlots: number;
  equipmentSlots?: string[];
  items?: (Item | null)[];
  equipment?: Record<string, Item | null>;
}

export class Inventory<Item = unknown, Context = unknown> {
  constructor(spec?: InventorySpec<Item>, options?: { rules?: InventoryRules<Item, Context> });
  readonly itemSlotCount: number;
  readonly equipmentSlots: string[];
  state: InventoryState<Item>;
  get(location: InventoryLocation): Item | null;
  add(item: Item): ItemLocation | null;
  remove(location: InventoryLocation): Item | null;
  canMove(from: InventoryLocation, to: InventoryLocation): boolean;
  move(from: InventoryLocation, to: InventoryLocation): boolean;
  sort(compare: (a: Item, b: Item) => number): this;
  canUse(location: InventoryLocation, context?: Context): boolean;
  use(location: InventoryLocation, context?: Context): unknown;
  subscribe(listener: (event: InventoryEvent<Item>) => void): () => boolean;
  snapshot(): InventoryState<Item>;
}

export class InventoryScene<Item = unknown, Context = unknown> extends Phaser.Scene {
  constructor(config?: Phaser.Types.Scenes.SettingsConfig & { recipes?: unknown[] });
  inventory: Inventory<Item, Context>;
  getInventory(): Inventory<Item, Context>;
  pgeCreateInventoryDisplay(): void;
  pgeRenderInventoryState(state: InventoryState<Item>): void;
  moveInventoryItem(from: InventoryLocation, to: InventoryLocation): boolean;
  useInventoryItem(location: InventoryLocation, context?: Context): unknown;
  refresh(): void;
}

export interface InventoryDragDropOptions<Item = unknown> {
  id?: string; x?: number; y?: number; columns?: number; slotSize?: number; gap?: number;
  equipmentX?: number; equipmentY?: number; slotColor?: number; slotBorderColor?: number;
  itemColor?: number; dragDepth?: number; fontFamily?: string; labelSize?: number;
  labelColor?: string; itemTextSize?: number; showItemSlotLabels?: boolean; activationDelayMs?: number;
  formatEquipmentSlot?(slot: string, scene: InventoryScene<Item>): string;
  getItemLabel?(item: Item, scene: InventoryScene<Item>): string;
  renderItem?(scene: InventoryScene<Item>, item: Item, detail: { x: number; y: number; size: number; location: InventoryLocation }): Phaser.GameObjects.Container;
  onActivate?(scene: InventoryScene<Item>, item: Item, detail: { location: InventoryLocation }): unknown;
}
export function createInventoryDragDropRecipe<Item = unknown>(options?: InventoryDragDropOptions<Item>): {
  id: string;
  policies: Record<string, (scene: InventoryScene<Item>) => void | (() => void)>;
};
