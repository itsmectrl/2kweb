const SOUND_KEY = 'all2k_wheel_sound';

let ctx = null;
let enabled = false;

try {
  enabled = localStorage.getItem(SOUND_KEY) === 'on';
} catch {
  enabled = false;
}

function getContext() {
  if (ctx) return ctx;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  ctx = new AudioCtx();
  return ctx;
}

export function isSoundEnabled() {
  return enabled;
}

export function setSoundEnabled(next) {
  enabled = Boolean(next);
  try {
    localStorage.setItem(SOUND_KEY, enabled ? 'on' : 'off');
  } catch {
    /* ignore */
  }
  if (enabled) {
    playClick(true);
  }
  return enabled;
}

export function toggleSound() {
  return setSoundEnabled(!enabled);
}

export function playClick(force = false) {
  if (!enabled && !force) return;
  const audio = getContext();
  if (!audio) return;
  if (audio.state === 'suspended') {
    audio.resume().catch(() => {});
  }

  const now = audio.currentTime;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(1750, now);
  osc.frequency.exponentialRampToValueAtTime(420, now + 0.014);

  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.016);

  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(now);
  osc.stop(now + 0.018);
}
