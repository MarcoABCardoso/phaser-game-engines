/**
 * Install and remove opt-in mechanics without assigning their state schema to a host.
 * A mechanic is a function `(host) => cleanup` or an object with `install(host)`.
 */
export declare function createMechanicHost(host: any): Readonly<{
    install: (mechanic: any) => any;
    remove: (mechanic: any) => any;
    clear: () => void;
    has: (mechanic: any) => boolean;
    list: () => any[];
}>;
