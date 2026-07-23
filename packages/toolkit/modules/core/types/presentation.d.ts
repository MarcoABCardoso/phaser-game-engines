export type PresentationDescriptor = {
    root: any;
    body?: any;
    update?: (model: any) => void;
    destroy?: () => void;
};
export type PresentationFactory = (context: any) => object | PresentationDescriptor;
export type PresentationDefinitions = {
    prefabs?: Record<string, PresentationFactory>;
    presenters?: Record<string, PresentationFactory>;
};
export type PresentationHandle = Readonly<{
    root: any;
    body: any;
    update(model: any): boolean;
    destroy(): boolean;
    readonly active: boolean;
}>;
export type PresentationHost = Readonly<{
    createPrefab(name: string, props?: Record<string, any>, fallback?: PresentationFactory): PresentationHandle;
    present(name: string, props?: Record<string, any>, fallback?: PresentationFactory): PresentationHandle;
    hasPrefab(name: string): boolean;
    hasPresenter(name: string): boolean;
    clear(): void;
    readonly size: number;
}>;
/**
 * Create a renderer-neutral registry for world-object prefabs and composite presenters.
 * Factories receive `{ scene, ...props }` and return either a root object or a
 * `{ root, body?, update?, destroy? }` descriptor. Every returned handle is disposable.
 * @param {any} scene
 * @param {PresentationDefinitions} definitions
 * @returns {PresentationHost}
 */
export declare function createPresentationHost(scene: any, definitions?: PresentationDefinitions): PresentationHost;
