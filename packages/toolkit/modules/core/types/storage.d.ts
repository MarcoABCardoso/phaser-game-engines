/** @typedef {{ read(key: string): string|null, write(key: string, value: string): void, remove(key: string): unknown, list(prefix?: string): string[] }} StorageAdapter */
export type StorageAdapter = {
    read(key: string): string | null;
    write(key: string, value: string): void;
    remove(key: string): unknown;
    list(prefix?: string): string[];
};
/** In-memory storage adapter for tests, server tools, and ephemeral sessions. */
export declare function createMemoryStorage(initial?: {}): Readonly<{
    read: (key: any) => any;
    write: (key: any, value: any) => void;
    remove: (key: any) => boolean;
    list: (prefix?: string) => string[];
}>;
/** Browser localStorage adapter, injected for testability. */
export declare function createLocalStorageAdapter(storage?: Storage): Readonly<{
    read: (key: any) => string | null;
    write: (key: any, value: any) => void;
    remove: (key: any) => void;
    list: (prefix?: string) => (string | null)[];
}>;
/** Version-aware save slots with a staging write and recoverable load failures.
 * @param {{ storage: StorageAdapter, prefix?: string, codec?: { serialize(source: unknown): unknown, deserialize(snapshot: unknown, target?: unknown): unknown } }} options
 */
export declare function createSaveStore({ storage, prefix, codec }?: {
    storage: StorageAdapter;
    prefix?: string;
    codec?: {
        serialize(source: unknown): unknown;
        deserialize(snapshot: unknown, target?: unknown): unknown;
    };
}): Readonly<{
    save(slot: any, source: any): any;
    load(slot: any, target: any): {
        ok: boolean;
        reason: string;
        value: null;
        error?: undefined;
        recovery?: undefined;
    } | {
        ok: boolean;
        value: any;
        reason?: undefined;
        error?: undefined;
        recovery?: undefined;
    } | {
        value?: undefined;
        ok: boolean;
        reason: string;
        error: unknown;
        recovery: {
            raw: string;
        };
    };
    remove(slot: any): unknown;
    slots(): string[];
}>;
