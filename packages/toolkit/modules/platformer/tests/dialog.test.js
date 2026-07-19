import { describe, it, expect } from 'vitest';
import {
  createDialog,
  currentTurn,
  isTyping,
  tickDialog,
  visibleText,
  advanceDialog,
  TYPE_SPEED,
} from '@phaser-game-engines/toolkit/platformer/systems/dialog.js';

const convo = () => [
  { speaker: 'a', side: 'left', text: 'hello' },
  { speaker: 'b', side: 'right', text: 'hi there' },
];

describe('dialog state machine', () => {
  it('starts on the first turn with nothing revealed', () => {
    const s = createDialog(convo());
    expect(s.index).toBe(0);
    expect(s.done).toBe(false);
    expect(visibleText(s)).toBe('');
    expect(isTyping(s)).toBe(true);
    expect(currentTurn(s).text).toBe('hello');
  });

  it('reveals characters over time and stops typing when fully shown', () => {
    const s = createDialog(convo());
    // Half a second at the default speed reveals ~TYPE_SPEED/2 chars — enough for
    // a 5-char line. Cap it and confirm typing ends.
    tickDialog(s, 1000);
    expect(visibleText(s)).toBe('hello');
    expect(isTyping(s)).toBe(false);
  });

  it('reveal is gradual, not instant', () => {
    const s = createDialog([{ speaker: 'a', side: 'left', text: 'abcdefghij' }]);
    const oneCharMs = (1000 / TYPE_SPEED) * 2; // ~2 chars' worth
    tickDialog(s, oneCharMs);
    const shown = visibleText(s).length;
    expect(shown).toBeGreaterThan(0);
    expect(shown).toBeLessThan(10);
  });

  it('never reveals past the end of the line', () => {
    const s = createDialog([{ speaker: 'a', side: 'left', text: 'hey' }]);
    tickDialog(s, 100000);
    expect(visibleText(s)).toBe('hey');
    expect(s.shown).toBe(3);
  });

  it('advancing mid-type completes the current line instead of skipping it', () => {
    const s = createDialog(convo());
    advanceDialog(s); // still typing -> finish the reveal
    expect(visibleText(s)).toBe('hello');
    expect(s.index).toBe(0);
    expect(isTyping(s)).toBe(false);
  });

  it('advancing a finished line moves to the next turn', () => {
    const s = createDialog(convo());
    advanceDialog(s); // finish "hello"
    advanceDialog(s); // -> next turn
    expect(s.index).toBe(1);
    expect(visibleText(s)).toBe('');
    expect(currentTurn(s).text).toBe('hi there');
  });

  it('advancing past the last finished line ends the conversation', () => {
    const s = createDialog(convo());
    advanceDialog(s); // finish "hello"
    advanceDialog(s); // -> turn 2
    advanceDialog(s); // finish "hi there"
    expect(s.done).toBe(false);
    advanceDialog(s); // -> done
    expect(s.done).toBe(true);
    expect(currentTurn(s)).toBe(null);
    expect(visibleText(s)).toBe('');
  });

  it('a full conversation takes exactly two advances per turn (skip, then next)', () => {
    const s = createDialog(convo());
    let taps = 0;
    while (!s.done && taps < 20) {
      advanceDialog(s);
      taps += 1;
    }
    expect(s.done).toBe(true);
    expect(taps).toBe(convo().length * 2);
  });
});
