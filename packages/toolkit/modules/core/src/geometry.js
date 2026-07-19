/** Inclusive point-in-rectangle query. Rectangles use top-left `{ x, y, w, h }`. */
export function pointInRect(x, y, rect, marginX = 0, marginY = marginX) {
  if (!rect) return false;
  return x >= rect.x - marginX
    && x <= rect.x + rect.w + marginX
    && y >= rect.y - marginY
    && y <= rect.y + rect.h + marginY;
}

/** Strict overlap for centre-based boxes `{ x, y, w, h }`; touching is not overlap. */
export function boxesOverlap(a, b) {
  return Math.abs(a.x - b.x) * 2 < a.w + b.w
    && Math.abs(a.y - b.y) * 2 < a.h + b.h;
}

export function entitiesInRect(entities, rect, getPoint = (entity) => entity) {
  return [...entities].filter((entity) => {
    const point = getPoint(entity);
    return point && pointInRect(point.x, point.y, rect);
  });
}
