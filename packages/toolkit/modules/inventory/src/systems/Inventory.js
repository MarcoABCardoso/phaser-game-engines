const ITEM_LOCATION = 'item';
const EQUIPMENT_LOCATION = 'equipment';

/**
 * Headless slot inventory. Items are game-owned values; this class only manages
 * their locations and delegates use/equipment policy to a rules adapter.
 */
export default class Inventory {
  constructor(spec = {}, options = {}) {
    const itemSlotCount = spec.itemSlots ?? 0;
    if (!Number.isInteger(itemSlotCount) || itemSlotCount < 0) {
      throw new TypeError('Inventory itemSlots must be a non-negative integer.');
    }
    const equipmentSlots = spec.equipmentSlots ?? [];
    if (!Array.isArray(equipmentSlots) || equipmentSlots.some((slot) => typeof slot !== 'string' || !slot)) {
      throw new TypeError('Inventory equipmentSlots must be an array of non-empty strings.');
    }
    if (new Set(equipmentSlots).size !== equipmentSlots.length) {
      throw new Error('Inventory equipment slot names must be unique.');
    }

    this.rules = options.rules ?? {};
    this.listeners = new Set();
    this.state = {
      items: Array.from({ length: itemSlotCount }, (_, index) => spec.items?.[index] ?? null),
      equipment: Object.fromEntries(equipmentSlots.map((slot) => [slot, spec.equipment?.[slot] ?? null])),
    };
  }

  get itemSlotCount() { return this.state.items.length; }
  get equipmentSlots() { return Object.keys(this.state.equipment); }

  get(location) {
    const normalized = this.#location(location);
    return normalized.kind === ITEM_LOCATION
      ? this.state.items[normalized.index]
      : this.state.equipment[normalized.slot];
  }

  add(item) {
    if (item == null) throw new TypeError('Cannot add an empty item to inventory.');
    const index = this.state.items.indexOf(null);
    if (index < 0) return null;
    this.state.items[index] = item;
    const location = { kind: ITEM_LOCATION, index };
    this.#publish('added', { item, location });
    return location;
  }

  remove(location) {
    const normalized = this.#location(location);
    const item = this.get(normalized);
    if (item == null) return null;
    this.#set(normalized, null);
    this.#publish('removed', { item, location: normalized });
    return item;
  }

  canMove(from, to) {
    const source = this.#location(from);
    const destination = this.#location(to);
    const item = this.get(source);
    if (item == null) return false;
    const displaced = this.get(destination);
    return this.#accepts(destination, item, source)
      && (displaced == null || this.#accepts(source, displaced, destination));
  }

  move(from, to) {
    const source = this.#location(from);
    const destination = this.#location(to);
    if (sameLocation(source, destination) || !this.canMove(source, destination)) return false;
    const item = this.get(source);
    const displaced = this.get(destination);
    this.#set(source, displaced);
    this.#set(destination, item);
    this.#publish('moved', { item, displaced, from: source, to: destination });
    return true;
  }

  sort(compare) {
    if (typeof compare !== 'function') throw new TypeError('Inventory sort requires a compare function.');
    const occupied = this.state.items.filter((item) => item != null).sort(compare);
    this.state.items = [...occupied, ...Array(this.itemSlotCount - occupied.length).fill(null)];
    this.#publish('sorted', {});
    return this;
  }

  canUse(location, context) {
    const normalized = this.#location(location);
    const item = this.get(normalized);
    if (item == null) return false;
    if (this.rules.canUse) return Boolean(this.rules.canUse(item, { inventory: this, location: normalized, context }));
    return item.usable === true || item.tags?.includes?.('usable');
  }

  use(location, context) {
    const normalized = this.#location(location);
    const item = this.get(normalized);
    if (!this.canUse(normalized, context)) return false;
    const result = this.rules.useItem?.(item, { inventory: this, location: normalized, context });
    if (result === false) return false;
    if (result?.consume === true || result === 'consume') this.remove(normalized);
    else this.#publish('used', { item, location: normalized, result });
    return result ?? true;
  }

  subscribe(listener) {
    if (typeof listener !== 'function') throw new TypeError('Inventory listener must be a function.');
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  snapshot() { return structuredClone(this.state); }

  #accepts(location, item, from) {
    if (location.kind === ITEM_LOCATION) return true;
    if (this.rules.canEquip) {
      return Boolean(this.rules.canEquip(item, location.slot, { inventory: this, from }));
    }
    const allowed = item.equipmentSlots ?? item.equippable;
    return allowed === location.slot || allowed === true
      || allowed?.includes?.(location.slot)
      || item.tags?.includes?.(`equip:${location.slot}`);
  }

  #location(location) {
    if (location?.kind === ITEM_LOCATION
      && Number.isInteger(location.index)
      && location.index >= 0
      && location.index < this.itemSlotCount) return { kind: ITEM_LOCATION, index: location.index };
    if (location?.kind === EQUIPMENT_LOCATION
      && typeof location.slot === 'string'
      && Object.hasOwn(this.state.equipment, location.slot)) return { kind: EQUIPMENT_LOCATION, slot: location.slot };
    throw new RangeError('Unknown inventory location.');
  }

  #set(location, value) {
    if (location.kind === ITEM_LOCATION) this.state.items[location.index] = value;
    else this.state.equipment[location.slot] = value;
  }

  #publish(type, detail) {
    const event = Object.freeze({ type, ...detail, state: this.snapshot() });
    for (const listener of [...this.listeners]) listener(event);
  }
}

function sameLocation(a, b) {
  return a.kind === b.kind && (a.kind === ITEM_LOCATION ? a.index === b.index : a.slot === b.slot);
}

