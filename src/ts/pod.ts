/* Copyright (c) 2026 itsmectrl. All Rights Reserved. */
import { formatTemplate } from './i18n-runtime.js';
import type { ClientStrings } from './types.js';

const SOUND_PREF_KEY = 'a2k_wheel_sound';

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export interface PodController {
  setTag: (tag: string) => void;
}

export function initPod(strings: ClientStrings): PodController {
  const lcdEl = document.getElementById('lcd');
  const gripEl = document.getElementById('grip');
  const wheelEl = document.getElementById('wheel');
  const menuBtn = document.getElementById('bm');
  const prevBtn = document.getElementById('bp');
  const nextBtn = document.getElementById('bn');
  const playBtn = document.getElementById('bl');
  const selectBtn = document.getElementById('bc');
  const soundBtn = document.getElementById('sound-toggle') as HTMLButtonElement | null;

  if (!lcdEl || !gripEl || !wheelEl) {
    return { setTag: () => {} };
  }

  const short = strings.pod.short;
  const arrowChar = strings.dir === 'rtl' ? '‹' : '›';
  let sel = 0;
  let view = -1;
  let rot = 0;
  let footerText = short.footerIdle;
  let soundEnabled = false;
  let audioCtx: AudioContext | null = null;

  try {
    soundEnabled = localStorage.getItem(SOUND_PREF_KEY) === '1';
  } catch {
    soundEnabled = false;
  }

  const updateSoundButton = (): void => {
    if (!soundBtn) return;
    soundBtn.setAttribute('aria-pressed', String(soundEnabled));
    soundBtn.textContent = soundEnabled
      ? strings.pod.soundOn
      : strings.pod.soundOff;
  };

  const playClickTone = (): void => {
    if (!soundEnabled) return;
    try {
      const AudioCtor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtor) return;
      if (!audioCtx) {
        audioCtx = new AudioCtor();
      }
      if (audioCtx.state === 'suspended') {
        void audioCtx.resume();
      }
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1150, now);
      osc.frequency.exponentialRampToValueAtTime(340, now + 0.018);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.022);
    } catch {
      /* ignore audio playback restrictions */
    }
  };

  if (soundBtn) {
    updateSoundButton();
    soundBtn.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      try {
        localStorage.setItem(SOUND_PREF_KEY, soundEnabled ? '1' : '0');
      } catch {
        /* ignore storage restrictions */
      }
      updateSoundButton();
      if (soundEnabled) {
        playClickTone();
      }
    });
  }

  const buildHeader = (title: string): string =>
    `<div class="lh"><span>${escapeHtml(title)}</span><span aria-hidden="true">▮▮▮</span></div>`;

  const render = (): void => {
    if (view < 0) {
      const rows = short.menu
        .map((label, idx) => {
          const currentAttr = idx === sel ? ' aria-current="true"' : '';
          const chevron = idx > 0 ? `<span class="chev" aria-hidden="true">${arrowChar}</span>` : '';
          return `<button class="it" type="button" data-i="${idx}"${currentAttr}><span>${escapeHtml(label)}</span>${chevron}</button>`;
        })
        .join('');
      lcdEl.innerHTML =
        buildHeader(short.headerRoot) +
        rows +
        `<div class="lf"><bdi dir="auto">${escapeHtml(footerText)}</bdi></div>`;
      return;
    }

    const title = short.paneTitles[view] ?? short.headerRoot;
    const lines = short.panes[view] ?? [];
    lcdEl.innerHTML =
      buildHeader(title) +
      lines
        .map((line) => `<div class="ln">${escapeHtml(line)}</div>`)
        .join('');
  };

  const feedback = (): void => {
    try {
      if (typeof navigator.vibrate === 'function') {
        navigator.vibrate(8);
      }
    } catch {
      /* ignore */
    }
    playClickTone();
  };

  const step = (delta: number): void => {
    if (view >= 0) return;
    const total = short.menu.length;
    sel = (sel + delta + total) % total;
    render();
    feedback();
  };

  const triggerDownload = (): void => {
    const primaryDl = document.querySelector<HTMLAnchorElement>('[data-dl]');
    if (primaryDl && primaryDl.href) {
      feedback();
      window.location.href = primaryDl.href;
    }
  };

  const pick = (): void => {
    if (view >= 0) return;
    if (sel === 0) {
      triggerDownload();
      return;
    }
    view = sel;
    render();
    feedback();
  };

  lcdEl.addEventListener('click', (event) => {
    const target = event.target as HTMLElement | null;
    const btn = target?.closest<HTMLButtonElement>('.it');
    if (!btn || btn.dataset.i === undefined) return;
    const idx = Number(btn.dataset.i);
    if (!Number.isNaN(idx)) {
      sel = idx;
      pick();
    }
  });

  menuBtn?.addEventListener('click', () => {
    view = -1;
    render();
    feedback();
  });
  prevBtn?.addEventListener('click', () => step(-1));
  nextBtn?.addEventListener('click', () => step(1));
  playBtn?.addEventListener('click', triggerDownload);
  selectBtn?.addEventListener('click', pick);

  let lastAngle: number | null = null;
  let accum = 0;

  const pointerAngle = (event: PointerEvent): number => {
    const rect = wheelEl.getBoundingClientRect();
    return (
      (Math.atan2(
        event.clientY - rect.top - rect.height / 2,
        event.clientX - rect.left - rect.width / 2
      ) *
        180) /
      Math.PI
    );
  };

  wheelEl.addEventListener('pointerdown', (event) => {
    if (event.target !== wheelEl) return;
    lastAngle = pointerAngle(event);
    accum = 0;
    wheelEl.setPointerCapture(event.pointerId);
  });

  wheelEl.addEventListener('pointermove', (event) => {
    if (lastAngle === null) return;
    const current = pointerAngle(event);
    let delta = current - lastAngle;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    lastAngle = current;
    accum += delta;
    rot += delta;
    gripEl.style.setProperty('--r', `${rot}deg`);
    while (accum >= 30) {
      accum -= 30;
      step(1);
    }
    while (accum <= -30) {
      accum += 30;
      step(-1);
    }
  });

  const endDrag = (): void => {
    lastAngle = null;
  };
  wheelEl.addEventListener('pointerup', endDrag);
  wheelEl.addEventListener('pointercancel', endDrag);

  wheelEl.addEventListener('keydown', (event) => {
    const nextKey = strings.dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
    const prevKey = strings.dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
    if (event.key === 'ArrowDown' || event.key === nextKey) {
      event.preventDefault();
      step(1);
    } else if (event.key === 'ArrowUp' || event.key === prevKey) {
      event.preventDefault();
      step(-1);
    } else if (event.key === 'Enter' || event.key === ' ') {
      if (event.target === wheelEl) {
        event.preventDefault();
        pick();
      }
    } else if (event.key === 'Escape' || event.key === 'Backspace') {
      if (view >= 0) {
        event.preventDefault();
        view = -1;
        render();
      }
    }
  });

  render();

  return {
    setTag: (tag: string): void => {
      footerText = tag
        ? formatTemplate(short.footerTag, { tag })
        : short.footerIdle;
      render();
    }
  };
}
