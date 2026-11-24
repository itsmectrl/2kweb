import { fetchLatestRelease, applyReleaseLinks } from '../shared/release.js';
import { initSmartDownload, toggleTheme, getTheme, getShareSiteUrl } from '../shared/platform.js';
import { mountWheel } from '../shared/wheel.js';
import { initI18n, loadLanguage, getLang, onLangChange, t } from '../shared/i18n.js';

const $ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const saveData = Boolean(navigator.connection && navigator.connection.saveData);

if (saveData) {
  root.dataset.anim = 'paused';
}

/* 1. Marquee text */
$('[data-m]').forEach((m) => {
  m.textContent = m.dataset.m.repeat(8);
});

/* 2. Pause off-screen animations & tab hidden for mid-range Android battery/perf */
const animEls = $('[data-anim-observe]');
if (animEls.length && 'IntersectionObserver' in window) {
  const animIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        e.target.classList.toggle('anim-off', !e.isIntersecting);
      });
    },
    { threshold: 0.01 }
  );
  animEls.forEach((el) => animIO.observe(el));
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    root.dataset.tabHidden = '1';
  } else {
    delete root.dataset.tabHidden;
  }
});

/* 3. Draggable Hero Skateboard (swipe up = kickflip, swipe sideways = shove-it, combo counter) */
const stage = document.getElementById('m-stage');
const deckWrap = document.getElementById('m-deck');
const deckInner = document.getElementById('m-deck-inner');
const trickCountEl = document.getElementById('m-tc');
const comboEl = document.getElementById('m-combo');
const trickStatusEl = document.getElementById('m-trick-status');

let totalTricks = 0;
let combo = 0;
let comboTimer = null;
let trickBusy = false;

function triggerTrick(type) {
  if (!deckInner || trickBusy) return;

  totalTricks += 1;
  combo += 1;
  if (trickCountEl) trickCountEl.textContent = String(totalTricks);
  if (comboEl) {
    comboEl.textContent = combo >= 2 ? `COMBO x${combo}` : 'CLEAN';
    comboEl.classList.add('is-hot');
  }
  if (trickStatusEl) {
    const label = type === 'flip' ? 'Kickflip' : 'Shove-it';
    trickStatusEl.textContent = `${label}! Tricks: ${totalTricks}${combo >= 2 ? `, Combo x${combo}` : ''}`;
  }

  clearTimeout(comboTimer);
  comboTimer = setTimeout(() => {
    combo = 0;
    if (comboEl) comboEl.classList.remove('is-hot');
  }, 2400);

  if (navigator.vibrate) {
    try {
      navigator.vibrate(10);
    } catch {
      /* ignore */
    }
  }

  if (reducedMotion) return;

  trickBusy = true;
  const cls = type === 'flip' ? 'is-flip' : type === 'shove-l' ? 'is-shove-l' : 'is-shove-r';
  deckInner.classList.remove('is-flip', 'is-shove-l', 'is-shove-r');
  void deckInner.offsetWidth;
  deckInner.classList.add(cls);
  deckInner.addEventListener(
    'animationend',
    () => {
      deckInner.classList.remove(cls);
      trickBusy = false;
    },
    { once: true }
  );
}

if (stage) {
  let sx = 0;
  let sy = 0;
  let activeId = null;

  stage.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button')) return;
    activeId = e.pointerId;
    sx = e.clientX;
    sy = e.clientY;
    try {
      stage.setPointerCapture(activeId);
    } catch {
      /* ignore */
    }
  });

  stage.addEventListener('pointermove', (e) => {
    if (activeId !== e.pointerId || !deckWrap) return;
    const dx = Math.max(-28, Math.min(28, e.clientX - sx));
    const dy = Math.max(-28, Math.min(28, e.clientY - sy));
    deckWrap.style.transform = `translate(${dx * 0.45}px, ${dy * 0.45}px) rotate(${74 + dx * 0.4}deg)`;
  });

  const finishSwipe = (e) => {
    if (activeId !== e.pointerId) return;
    const dx = e.clientX - sx;
    const dy = e.clientY - sy;
    if (deckWrap) deckWrap.style.transform = '';
    try {
      stage.releasePointerCapture(activeId);
    } catch {
      /* ignore */
    }
    activeId = null;

    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    if (absX < 14 && absY < 14) {
      triggerTrick('flip');
    } else if (absX > absY) {
      triggerTrick(dx < 0 ? 'shove-l' : 'shove-r');
    } else if (dy < -14) {
      triggerTrick('flip');
    } else {
      triggerTrick('flip');
    }
  };
  stage.addEventListener('pointerup', finishSwipe);
  stage.addEventListener('pointercancel', finishSwipe);
}

document.getElementById('btn-flip')?.addEventListener('click', () => triggerTrick('flip'));
document.getElementById('btn-spin')?.addEventListener('click', () => triggerTrick('shove-r'));

/* 4. Why Carousel Dots Sync */
const carousel = document.getElementById('why-carousel');
const dotButtons = $('[data-slide-dot]');
if (carousel && dotButtons.length) {
  const cards = [...carousel.children];
  const setActiveDot = (idx) => {
    dotButtons.forEach((b, i) => b.setAttribute('aria-selected', String(i === idx)));
  };

  dotButtons.forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      cards[idx]?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', inline: 'center', block: 'nearest' });
      setActiveDot(idx);
    });
  });

  let scrollTimer = null;
  carousel.addEventListener(
    'scroll',
    () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        const center = carousel.scrollLeft + carousel.clientWidth / 2;
        let closest = 0;
        let bestDist = Infinity;
        cards.forEach((card, i) => {
          const cardCenter = card.offsetLeft + card.offsetWidth / 2;
          const dist = Math.abs(cardCenter - center);
          if (dist < bestDist) {
            bestDist = dist;
            closest = i;
          }
        });
        setActiveDot(closest);
      }, 60);
    },
    { passive: true }
  );
}

/* 5. Share Button in Final CTA */
const shareBtn = document.getElementById('m-share-btn');
if (shareBtn) {
  shareBtn.addEventListener('click', async () => {
    const url = getShareSiteUrl();
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: 'All2K for Android',
          text: 'Download All2K for Android',
          url
        });
        return;
      } catch {
        /* fallback or cancel */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      const prev = shareBtn.textContent;
      shareBtn.textContent = t('dl.copied', 'Copied');
      setTimeout(() => {
        shareBtn.textContent = prev;
      }, 1800);
    } catch {
      /* ignore */
    }
  });
}

/* 6. Negative Mode, View Override, Language Picker */
const themeButtons = $('[data-theme-toggle]');
const syncThemeButtons = () => {
  const neg = getTheme() === 'negative';
  themeButtons.forEach((btn) => {
    btn.setAttribute('aria-pressed', String(neg));
    btn.textContent = neg ? '◐' : '◑';
  });
};
themeButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    toggleTheme();
    syncThemeButtons();
  });
});
document.addEventListener('all2k:themechange', syncThemeButtons);
syncThemeButtons();

$('[data-switch-view]').forEach((link) => {
  link.addEventListener('click', () => {
    try {
      localStorage.setItem('all2k_view', link.dataset.switchView);
    } catch {
      /* ignore */
    }
  });
});

const langButtons = $('[data-lang-btn]');
const syncLangButtons = () => {
  const curLang = getLang();
  langButtons.forEach((btn) => {
    btn.setAttribute('aria-pressed', String(btn.dataset.langBtn === curLang));
  });
};
langButtons.forEach((btn) => {
  btn.addEventListener('click', () => loadLanguage(btn.dataset.langBtn));
});
onLangChange(syncLangButtons);

/* 7. Inline SHA-256 copy button */
document.querySelector('[data-inline-copy]')?.addEventListener('click', async (e) => {
  const hash = document.querySelector('[data-inline-hash]')?.textContent || '';
  if (!hash) return;
  try {
    await navigator.clipboard.writeText(hash);
    const btn = e.currentTarget;
    const prev = btn.textContent;
    btn.textContent = t('dl.copied', 'Copied');
    setTimeout(() => {
      btn.textContent = prev;
    }, 1800);
  } catch {
    /* ignore */
  }
});

/* 8. Release API + Smart Download + Thumb-Zone Click Wheel */
let currentRelease = null;
const smart = initSmartDownload({ getRelease: () => currentRelease });

mountWheel({
  mode: 'mobile',
  sections: [
    { selector: '#top', label: 'Top' },
    { selector: '#why', label: 'Why', labelKey: 'nav.why' },
    { selector: '#specs', label: 'Specs', labelKey: 'specs.heading' },
    { selector: '#install', label: 'Install', labelKey: 'nav.install' },
    { selector: '#faq', label: 'FAQ', labelKey: 'nav.faq' },
    { selector: '#final', label: 'Download', labelKey: 'nav.download' }
  ],
  onDownload: (trigger) => smart.openDownloadSheet(trigger)
});

smart.syncInlineSmartUI();

fetchLatestRelease().then((rel) => {
  currentRelease = rel;
  applyReleaseLinks(rel);
  smart.syncInlineSmartUI();
});

initI18n().then(syncLangButtons);
