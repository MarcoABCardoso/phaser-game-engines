/** Headless guard/state for asynchronous area transitions. */
export function createAreaTransitionController() {
  let active = false;
  let request = null;
  return Object.freeze({
    begin(areaId, entryId) {
      if (active) return null;
      active = true;
      request = { areaId, entryId };
      return request;
    },
    complete() {
      const completed = request;
      active = false;
      request = null;
      return completed;
    },
    cancel() {
      active = false;
      request = null;
    },
    get active() { return active; },
    get request() { return request; },
  });
}
