import { expect, test } from 'vitest';
import { createMenuGamepad } from '../input/menu-gamepad.js';

const pad = (...pressed) => ({
  buttons: Array.from({ length: 16 }, (_, index) => ({ pressed: pressed.includes(index) })),
});

test('menu gamepad actions are edge-triggered and independently mapped', () => {
  const input = createMenuGamepad();
  expect(input.read(pad(0, 9))).toMatchObject({ confirm: true, menu: true });
  expect(input.read(pad(0, 9))).toMatchObject({ confirm: false, menu: false });
  input.read(pad());
  expect(input.read(pad(1, 2, 3))).toMatchObject({ cancel: true, save: true, journal: true });
  input.read(pad());
  expect(input.read(pad(12, 15))).toMatchObject({ up: true, right: true });
});
