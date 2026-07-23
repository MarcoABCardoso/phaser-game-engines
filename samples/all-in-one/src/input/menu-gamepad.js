export function createMenuGamepad() {
  let previous = {};
  return Object.freeze({
    read(pad) {
      const current = {
        confirm: Boolean(pad?.buttons?.[0]?.pressed),
        cancel: Boolean(pad?.buttons?.[1]?.pressed),
        save: Boolean(pad?.buttons?.[2]?.pressed),
        journal: Boolean(pad?.buttons?.[3]?.pressed),
        menu: Boolean(pad?.buttons?.[9]?.pressed),
        left: Boolean(pad?.left || pad?.buttons?.[14]?.pressed),
        right: Boolean(pad?.right || pad?.buttons?.[15]?.pressed),
        up: Boolean(pad?.up || pad?.buttons?.[12]?.pressed),
        down: Boolean(pad?.down || pad?.buttons?.[13]?.pressed),
      };
      const pressed = Object.fromEntries(Object.entries(current).map(([name, down]) => [
        name, down && !previous[name],
      ]));
      previous = current;
      return pressed;
    },
    reset() { previous = {}; },
  });
}
