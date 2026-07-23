import { expect, test } from 'vitest';
import { gateDialogueInput } from '../input/dialogue-input.js';

const intent = (down, pressed = down) => ({
  move: { x: 1, y: 0 },
  actions: { interact: { down, pressed, released: !down } },
});

test('closing dialogue suppresses the same interact press until release', () => {
  const held = gateDialogueInput(intent(true), {
    dialogueOpen: false,
    waitingForInteractRelease: true,
  });
  expect(held.intent).toMatchObject({ move: { x: 0, y: 0 }, actions: {} });
  expect(held.waitingForInteractRelease).toBe(true);

  const released = gateDialogueInput(intent(false, false), {
    dialogueOpen: false,
    waitingForInteractRelease: held.waitingForInteractRelease,
  });
  expect(released.intent.actions).toEqual({});
  expect(released.waitingForInteractRelease).toBe(false);

  const nextPress = gateDialogueInput(intent(true), {
    dialogueOpen: false,
    waitingForInteractRelease: released.waitingForInteractRelease,
  });
  expect(nextPress.intent.actions.interact.pressed).toBe(true);
});

test('open dialogue suppresses movement and actions', () => {
  const gated = gateDialogueInput(intent(true), {
    dialogueOpen: true,
    waitingForInteractRelease: false,
  });
  expect(gated.intent).toMatchObject({ move: { x: 0, y: 0 }, actions: {} });
});
