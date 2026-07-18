/** Versioned snapshot envelope with explicit, sequential migrations. */
export declare function createSnapshotCodec({ version, capture, restore, migrations }?: {
    migrations?: {} | undefined;
    version?: number | undefined;
}): Readonly<{
    version: number;
    serialize: (source: any) => {
        version: number;
        data: any;
    };
    deserialize: (snapshot: any, target: any) => any;
}>;
