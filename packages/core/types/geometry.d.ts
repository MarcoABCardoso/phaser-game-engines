/** Inclusive point-in-rectangle query. Rectangles use top-left `{ x, y, w, h }`. */
export declare function pointInRect(x: any, y: any, rect: any, marginX?: number, marginY?: number): boolean;
/** Strict overlap for centre-based boxes `{ x, y, w, h }`; touching is not overlap. */
export declare function boxesOverlap(a: any, b: any): boolean;
export declare function entitiesInRect(entities: any, rect: any, getPoint?: (entity: any) => any): any[];
