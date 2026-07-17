// dialog.js — the pure state machine behind the dialogue box. No Phaser: it just
// tracks which turn we're on and how much of that turn's text has "typed out" so
// far, and answers the two questions the scene/HUD ask each frame — "what text is
// visible right now?" and "what does the interact key do?". Rendering (the box,
// portraits, colours) lives in the game's HUDScene; the lines themselves are content
// (e.g. src/content/dialog.js), passed to the scene as data. This is the tested seam.

// How fast text reveals, in characters per second.
export const TYPE_SPEED = 45;

// A conversation is an array of turns: { speaker, side, text }. State is a tiny
// cursor over it — the current turn `index`, how many characters are `shown`
// (fractional so typing is frame-rate independent), and whether we're `done`.
export function createDialog(turns) {
  return { turns, index: 0, shown: 0, done: false };
}

export function currentTurn(state) {
  return state.done ? null : state.turns[state.index] || null;
}

// True while the current turn is still revealing characters — the interact key
// finishes the reveal before it advances (the "skip, then next are two taps" rule).
export function isTyping(state) {
  const t = currentTurn(state);
  return t ? state.shown < t.text.length : false;
}

// Advance the type-on reveal by the frame's elapsed time.
export function tickDialog(state, deltaMs, speed = TYPE_SPEED) {
  const t = currentTurn(state);
  if (!t) return state;
  if (state.shown < t.text.length) {
    state.shown = Math.min(t.text.length, state.shown + (speed * deltaMs) / 1000);
  }
  return state;
}

export function visibleText(state) {
  const t = currentTurn(state);
  if (!t) return '';
  return t.text.slice(0, Math.floor(state.shown));
}

// The interact key funnels through here. If the current turn is still typing, the
// first press completes it instantly; once it's fully shown, the next press moves to
// the following turn, or marks the whole conversation `done` on the last one.
export function advanceDialog(state) {
  const t = currentTurn(state);
  if (!t) {
    state.done = true;
    return state;
  }
  if (state.shown < t.text.length) {
    state.shown = t.text.length; // first tap: finish revealing this turn
    return state;
  }
  if (state.index + 1 < state.turns.length) {
    state.index += 1; // next tap: on to the next turn
    state.shown = 0;
  } else {
    state.done = true; // last turn fully read: close the box
  }
  return state;
}
