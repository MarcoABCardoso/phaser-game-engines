const MUSIC_FREQUENCIES = Object.freeze({
  title: 146.83,
  camp: 174.61,
  grove: 196,
  inventory: 220,
  battle: 110,
  result: 261.63,
});

export function createAudioDirector({
  contextFactory = () => {
    const AudioContextType = globalThis.AudioContext ?? globalThis.webkitAudioContext;
    return AudioContextType ? new AudioContextType() : null;
  },
} = {}) {
  let context = null;
  let music = null;
  let current = null;
  const history = [];

  function audioContext() {
    context ??= contextFactory();
    return context;
  }

  function stopMusic() {
    try { music?.oscillator.stop(); } catch {}
    music?.gain.disconnect?.();
    music = null;
  }

  function transition(name, { enabled = true } = {}) {
    current = enabled ? name : null;
    history.push({ type: 'transition', name: current });
    stopMusic();
    if (!enabled) return current;
    const ctx = audioContext();
    if (!ctx) return current;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = name === 'battle' ? 'sawtooth' : 'sine';
    oscillator.frequency.value = MUSIC_FREQUENCIES[name] ?? 164.81;
    gain.gain.value = 0.012;
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start();
    music = { oscillator, gain };
    return current;
  }

  function cue(name, { enabled = true } = {}) {
    history.push({ type: 'cue', name });
    if (!enabled) return false;
    const ctx = audioContext();
    if (!ctx) return false;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.frequency.value = name === 'reward' ? 659.25 : name === 'choice' ? 523.25 : 392;
    gain.gain.setValueAtTime(0.035, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.13);
    return true;
  }

  function resume() { return audioContext()?.resume?.(); }
  function destroy() { stopMusic(); context?.close?.(); context = null; current = null; }

  return Object.freeze({
    transition, cue, resume, destroy,
    get current() { return current; },
    history: () => structuredClone(history),
  });
}

export const audioDirector = createAudioDirector();
