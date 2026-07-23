import { expect, test } from 'vitest';
import { createAudioDirector } from '../presentation/audio-director.js';

test('the game-owned audio director records music transitions and accessibility muting', () => {
  const audio = createAudioDirector({ contextFactory: () => null });
  expect(audio.transition('camp')).toBe('camp');
  audio.cue('collect');
  expect(audio.transition('battle', { enabled: false })).toBeNull();
  expect(audio.history()).toEqual([
    { type: 'transition', name: 'camp' },
    { type: 'cue', name: 'collect' },
    { type: 'transition', name: null },
  ]);
});
