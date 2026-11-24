import { isSoundEnabled, toggleSound, playClick } from './sound.js';
import { getTheme, toggleTheme } from './platform.js';
import { getLang, loadLanguage, t, onLangChange } from './i18n.js';

const DETENT_RAD = Math.PI / 6; // 30 degrees per detent

export function mountWheel({
  mode = 'desktop',
  sections = [],
  onDownload = () => {},
  onTogglePlay = null
}) {
  const dock = document.createElement('aside');
  dock.className = `wheel-dock ${mode === 'mobile' ? 'is-mobile' : 'is-desktop'}`;
  dock.setAttribute('aria-label', 'Click wheel navigation');

  const size = mode === 'mobile' ? 148 : 148;
  dock.style.setProperty('--wheel-size', `${size}px`);

  const shell = document.createElement('div');
  shell.className = 'wheel-shell';

  // Interactive drag ring (only touch-action: none target)
  const ring = document.createElement('div');
  ring.className = 'wheel-ring';
  ring.setAttribute('role', 'slider');
  ring.setAttribute('tabindex', '0');
  ring.setAttribute('aria-label', 'Scroll wheel');
  ring.setAttribute('aria-valuemin', '0');
  ring.setAttribute('aria-valuemax', '100');
  ring.setAttribute('aria-valuenow', '0');

  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('aria-hidden', 'true');
  svg.classList.add('wheel-svg');

  const r = 44;
  const circ = 2 * Math.PI * r;

  const track = document.createElementNS(ns, 'circle');
  track.setAttribute('cx', '50');
  track.setAttribute('cy', '50');
  track.setAttribute('r', String(r));
  track.classList.add('wheel-track');

  const ticks = document.createElementNS(ns, 'circle');
  ticks.setAttribute('cx', '50');
  ticks.setAttribute('cy', '50');
  ticks.setAttribute('r', '34');
  ticks.classList.add('wheel-ticks');

  const progress = document.createElementNS(ns, 'circle');
  progress.setAttribute('cx', '50');
  progress.setAttribute('cy', '50');
  progress.setAttribute('r', String(r));
  progress.setAttribute('stroke-dasharray', circ.toFixed(2));
  progress.setAttribute('stroke-dashoffset', circ.toFixed(2));
  progress.classList.add('wheel-progress');

  svg.append(track, ticks, progress);

  const notch = document.createElement('div');
  notch.className = 'wheel-notch';
  notch.setAttribute('aria-hidden', 'true');

  // Four cardinal buttons
  const btnMenu = document.createElement('button');
  btnMenu.type = 'button';
  btnMenu.className = 'wheel-btn wheel-top';
  btnMenu.textContent = t('wheel.menu', 'MENU');
  btnMenu.setAttribute('aria-label', 'Open wheel menu');

  const btnPrev = document.createElement('button');
  btnPrev.type = 'button';
  btnPrev.className = 'wheel-btn wheel-left';
  btnPrev.textContent = '◄◄';
  btnPrev.setAttribute('aria-label', 'Previous section');

  const btnNext = document.createElement('button');
  btnNext.type = 'button';
  btnNext.className = 'wheel-btn wheel-right';
  btnNext.textContent = '►►';
  btnNext.setAttribute('aria-label', 'Next section');

  const btnPlay = document.createElement('button');
  btnPlay.type = 'button';
  btnPlay.className = 'wheel-btn wheel-bottom';
  btnPlay.textContent = '▶ ❙❙';
  btnPlay.setAttribute('aria-label', 'Pause or resume animations');
  btnPlay.setAttribute('aria-pressed', 'false');

  const btnCenter = document.createElement('button');
  btnCenter.type = 'button';
  btnCenter.className = 'wheel-center';
  btnCenter.textContent = '↓';
  btnCenter.setAttribute('aria-label', 'Download All2K');

  shell.append(ring, svg, notch, btnMenu, btnPrev, btnNext, btnPlay, btnCenter);

  // Controls row under the wheel: Sound toggle + Negative mode quick toggle (or mini expand)
  const controls = document.createElement('div');
  controls.className = 'wheel-controls';

  const soundBtn = document.createElement('button');
  soundBtn.type = 'button';
  soundBtn.className = 'wheel-chip';
  const syncSoundLabel = () => {
    const on = isSoundEnabled();
    soundBtn.setAttribute('aria-pressed', String(on));
    soundBtn.textContent = on ? t('wheel.soundOn', 'Sound: On') : t('wheel.soundOff', 'Sound: Off');
  };
  syncSoundLabel();
  soundBtn.addEventListener('click', () => {
    toggleSound();
    syncSoundLabel();
  });

  const miniExpandBtn = document.createElement('button');
  miniExpandBtn.type = 'button';
  miniExpandBtn.className = 'wheel-chip wheel-mini-expand';
  miniExpandBtn.textContent = 'WHEEL';
  miniExpandBtn.setAttribute('aria-label', 'Expand click wheel');

  controls.append(soundBtn);
  dock.append(shell, controls, miniExpandBtn);
  document.body.append(dock);

  // Wheel rotation & detents (Pointer Events only)
  let dragging = false;
  let pointerId = null;
  let lastAngle = 0;
  let lastTime = 0;
  let accumAngle = 0;
  let visualAngle = 0;

  function getAngle(e) {
    const rect = ring.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return Math.atan2(e.clientY - cy, e.clientX - cx);
  }

  function feedbackTick() {
    if (navigator.vibrate) {
      try {
        navigator.vibrate(8);
      } catch {
        /* ignore */
      }
    }
    playClick();
  }

  function stepScroll(dir, velocity = 0) {
    const accel = Math.min(3.2, 1 + velocity * 0.22);
    const px = dir * 110 * accel;
    window.scrollBy({ top: px, behavior: 'auto' });
    feedbackTick();
  }

  ring.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    dragging = true;
    pointerId = e.pointerId;
    lastAngle = getAngle(e);
    lastTime = performance.now();
    accumAngle = 0;
    try {
      ring.setPointerCapture(pointerId);
    } catch {
      /* ignore */
    }
  });

  ring.addEventListener('pointermove', (e) => {
    if (!dragging || e.pointerId !== pointerId) return;
    const now = performance.now();
    const angle = getAngle(e);
    let delta = angle - lastAngle;
    if (delta > Math.PI) delta -= Math.PI * 2;
    if (delta < -Math.PI) delta += Math.PI * 2;

    const dt = Math.max(8, now - lastTime) / 1000;
    const velocity = Math.abs(delta) / dt; // rad/s

    lastAngle = angle;
    lastTime = now;
    accumAngle += delta;
    visualAngle += delta * (180 / Math.PI);
    notch.style.transform = `rotate(${visualAngle.toFixed(1)}deg)`;

    while (Math.abs(accumAngle) >= DETENT_RAD) {
      const dir = accumAngle > 0 ? 1 : -1;
      accumAngle -= dir * DETENT_RAD;
      stepScroll(dir, velocity);
    }
  });

  const endDrag = (e) => {
    if (!dragging || e.pointerId !== pointerId) return;
    dragging = false;
    try {
      ring.releasePointerCapture(pointerId);
    } catch {
      /* ignore */
    }
    pointerId = null;
  };
  ring.addEventListener('pointerup', endDrag);
  ring.addEventListener('pointercancel', endDrag);

  // Keyboard support for ring
  ring.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      visualAngle += 30;
      notch.style.transform = `rotate(${visualAngle.toFixed(1)}deg)`;
      stepScroll(1, 0);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      visualAngle -= 30;
      notch.style.transform = `rotate(${visualAngle.toFixed(1)}deg)`;
      stepScroll(-1, 0);
    }
  });

  // Scroll progress sync
  function syncProgress() {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const pct = Math.min(1, Math.max(0, window.scrollY / max));
    const offset = circ * (1 - pct);
    progress.setAttribute('stroke-dashoffset', offset.toFixed(2));
    ring.setAttribute('aria-valuenow', String(Math.round(pct * 100)));
  }
  window.addEventListener('scroll', syncProgress, { passive: true });
  window.addEventListener('resize', syncProgress, { passive: true });
  syncProgress();

  // Section prev/next helpers
  function getSectionElements() {
    return sections
      .map((s) => ({ ...s, el: document.querySelector(s.selector) }))
      .filter((s) => Boolean(s.el));
  }

  function jumpSection(delta) {
    const list = getSectionElements();
    if (!list.length) return;
    const y = window.scrollY + 120;
    let currentIndex = 0;
    for (let i = 0; i < list.length; i++) {
      const top = list[i].el.getBoundingClientRect().top + window.scrollY;
      if (top <= y) currentIndex = i;
    }
    const nextIndex = Math.max(0, Math.min(list.length - 1, currentIndex + delta));
    list[nextIndex].el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    feedbackTick();
  }

  btnPrev.addEventListener('click', () => jumpSection(-1));
  btnNext.addEventListener('click', () => jumpSection(1));

  // Center = Download
  btnCenter.addEventListener('click', () => {
    feedbackTick();
    onDownload(btnCenter);
  });

  // Bottom = Play / Pause animations
  let paused = false;
  btnPlay.addEventListener('click', () => {
    paused = !paused;
    document.documentElement.dataset.anim = paused ? 'paused' : 'running';
    btnPlay.setAttribute('aria-pressed', String(paused));
    if (onTogglePlay) onTogglePlay(paused);
    feedbackTick();
  });

  // MENU sheet (sections + Negative mode + Sound + Language)
  let menuBackdrop = null;
  function closeMenu() {
    if (!menuBackdrop) return;
    menuBackdrop.remove();
    menuBackdrop = null;
    document.removeEventListener('keydown', onMenuEsc);
    btnMenu.focus();
  }
  function onMenuEsc(e) {
    if (e.key === 'Escape') closeMenu();
  }

  function openMenu() {
    if (menuBackdrop) {
      closeMenu();
      return;
    }
    feedbackTick();

    const backdrop = document.createElement('div');
    backdrop.className = 'sheet-backdrop';
    backdrop.setAttribute('role', 'dialog');
    backdrop.setAttribute('aria-modal', 'true');
    backdrop.setAttribute('aria-labelledby', 'wheel-menu-title');

    const panel = document.createElement('div');
    panel.className = 'sheet-panel';

    const head = document.createElement('div');
    head.className = 'sheet-head';

    const h2 = document.createElement('h2');
    h2.id = 'wheel-menu-title';
    h2.className = 'sheet-title';
    h2.textContent = t('sheet.menuTitle', 'Wheel Menu');

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'sheet-close';
    closeBtn.setAttribute('aria-label', 'Close menu');
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', closeMenu);

    head.append(h2, closeBtn);
    panel.append(head);

    // Section list
    const nav = document.createElement('nav');
    nav.className = 'sheet-nav';
    nav.setAttribute('aria-label', 'Page sections');
    getSectionElements().forEach((sec) => {
      const a = document.createElement('a');
      a.className = 'sheet-link';
      a.href = sec.selector;
      const label = document.createElement('span');
      label.textContent = sec.labelKey ? t(sec.labelKey, sec.label) : sec.label;
      const arrow = document.createElement('span');
      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = '→';
      a.append(label, arrow);
      a.addEventListener('click', () => {
        feedbackTick();
        closeMenu();
      });
      nav.append(a);
    });
    panel.append(nav);

    // Tools: Negative mode, Sound, Language
    const tools = document.createElement('div');
    tools.className = 'sheet-tools';

    // Negative mode row
    const themeRow = document.createElement('div');
    themeRow.className = 'tool-row';
    const themeLbl = document.createElement('span');
    themeLbl.className = 'tool-label';
    themeLbl.textContent = t('sheet.theme', 'Negative mode');
    const themeBtn = document.createElement('button');
    themeBtn.type = 'button';
    themeBtn.className = 'seg-btn';
    themeBtn.style.border = '2px solid var(--ink)';
    const syncThemeBtn = () => {
      const neg = getTheme() === 'negative';
      themeBtn.setAttribute('aria-pressed', String(neg));
      themeBtn.textContent = neg ? 'ON' : 'OFF';
    };
    syncThemeBtn();
    themeBtn.addEventListener('click', () => {
      toggleTheme();
      syncThemeBtn();
      feedbackTick();
    });
    themeRow.append(themeLbl, themeBtn);

    // Sound row
    const soundRow = document.createElement('div');
    soundRow.className = 'tool-row';
    const soundLbl = document.createElement('span');
    soundLbl.className = 'tool-label';
    soundLbl.textContent = t('sheet.sound', 'Wheel click');
    const soundMenuBtn = document.createElement('button');
    soundMenuBtn.type = 'button';
    soundMenuBtn.className = 'seg-btn';
    soundMenuBtn.style.border = '2px solid var(--ink)';
    const syncMenuSound = () => {
      const on = isSoundEnabled();
      soundMenuBtn.setAttribute('aria-pressed', String(on));
      soundMenuBtn.textContent = on ? 'ON' : 'OFF';
    };
    syncMenuSound();
    soundMenuBtn.addEventListener('click', () => {
      toggleSound();
      syncMenuSound();
      syncSoundLabel();
    });
    soundRow.append(soundLbl, soundMenuBtn);

    // Language row
    const langRow = document.createElement('div');
    langRow.className = 'tool-row';
    const langLbl = document.createElement('span');
    langLbl.className = 'tool-label';
    langLbl.textContent = t('sheet.lang', 'Language');
    const langGroup = document.createElement('div');
    langGroup.className = 'seg-group';
    ['en', 'fr', 'ar'].forEach((code) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'seg-btn';
      b.textContent = code.toUpperCase();
      b.setAttribute('aria-pressed', String(getLang() === code));
      b.addEventListener('click', async () => {
        await loadLanguage(code);
        langGroup.querySelectorAll('.seg-btn').forEach((btn) => {
          btn.setAttribute('aria-pressed', String(btn === b));
        });
        feedbackTick();
      });
      langGroup.append(b);
    });
    langRow.append(langLbl, langGroup);

    tools.append(themeRow, soundRow, langRow);
    panel.append(tools);

    backdrop.append(panel);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeMenu();
    });
    document.body.append(backdrop);
    menuBackdrop = backdrop;
    document.addEventListener('keydown', onMenuEsc);
    closeBtn.focus();
  }

  btnMenu.addEventListener('click', openMenu);

  // Mobile landscape / on-screen keyboard collapse to mini-wheel
  let userExpandedMini = false;
  function updateMiniState() {
    if (mode !== 'mobile') return;
    const isLandscapeShort = window.innerWidth > window.innerHeight && window.innerHeight < 500;
    const vv = window.visualViewport;
    const keyboardOpen = vv ? vv.height < window.innerHeight * 0.75 : false;
    const shouldMini = (isLandscapeShort || keyboardOpen) && !userExpandedMini;
    dock.classList.toggle('is-mini', shouldMini);
  }

  if (mode === 'mobile') {
    miniExpandBtn.addEventListener('click', () => {
      userExpandedMini = true;
      dock.classList.remove('is-mini');
    });
    window.addEventListener('resize', () => {
      userExpandedMini = false;
      updateMiniState();
    }, { passive: true });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateMiniState, { passive: true });
    }
    updateMiniState();
  }

  onLangChange(() => {
    btnMenu.textContent = t('wheel.menu', 'MENU');
    syncSoundLabel();
  });

  return { dock, openMenu, closeMenu };
}
