/* Copyright (c) 2026 itsmectrl. All Rights Reserved. */

import { fetchLatestRelease, applyReleaseLinks } from '../shared/release.js';
import { initSmartDownload, toggleTheme, getTheme } from '../shared/platform.js';
import { mountWheel } from '../shared/wheel.js';
import { initI18n, loadLanguage, getLang, onLangChange } from '../shared/i18n.js';

const $ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const saveData = Boolean(navigator.connection && navigator.connection.saveData);

const pre = document.getElementById('pre');
const cnt = document.getElementById('cnt');
let done = false;
const finishPre = () => {
  if (done) return;
  done = true;
  if (pre) pre.classList.add('done');
  document.body.classList.add('go');
};

if (reducedMotion || saveData) {
  finishPre();
} else {
  const t0 = performance.now();
  const step = (t) => {
    const p = Math.min(1, (t - t0) / 480);
    if (cnt) cnt.textContent = String(Math.round(p * 100)).padStart(3, '0');
    if (p < 1) {
      requestAnimationFrame(step);
    } else {
      setTimeout(finishPre, 80);
    }
  };
  requestAnimationFrame(step);
  setTimeout(finishPre, 1400);
}

const splitNode = (n, c = { i: 0 }) => {
  [...n.childNodes].forEach((k) => {
    if (k.nodeType === 3) {
      const f = document.createDocumentFragment();
      k.textContent.split(/(\s+)/).forEach((w) => {
        if (!w) return;
        if (/^\s+$/.test(w)) {
          f.append(' ');
          return;
        }
        const s = document.createElement('span');
        s.className = 'w';
        [...w].forEach((ch) => {
          const e = document.createElement('span');
          e.className = 'ch';
          e.style.setProperty('--i', c.i++);
          e.textContent = ch;
          s.append(e);
        });
        f.append(s);
      });
      k.replaceWith(f);
    } else if (k.nodeType === 1 && k.tagName !== 'BR') {
      splitNode(k, c);
    }
  });
};
$('[data-split]').forEach((h) => {
  h.setAttribute('aria-label', h.textContent);
  splitNode(h);
});

$('[data-m]').forEach((m) => {
  m.textContent = m.dataset.m.repeat(10);
});

const rvObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      rvObserver.unobserve(e.target);
      setTimeout(() => e.target.style.removeProperty('--d'), 1400);
    });
  },
  { threshold: 0.12 }
);
$('.rv').forEach((el) => rvObserver.observe(el));

const prog = $('.prog')[0];
let ticking = false;
const onScroll = () => {
  const y = window.scrollY;
  const max = root.scrollHeight - window.innerHeight;
  root.style.setProperty('--sy', y);
  if (prog) prog.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  ticking = false;
};
window.addEventListener(
  'scroll',
  () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  },
  { passive: true }
);

const cur = $('.cur')[0];
if (cur && window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reducedMotion) {
  let x = 0;
  let y = 0;
  let cx = 0;
  let cy = 0;
  let active = false;
  window.addEventListener('mousemove', (e) => {
    x = e.clientX;
    y = e.clientY;
    if (!active) {
      cx = x;
      cy = y;
      active = true;
    }
  });
  const loop = () => {
    if (active) {
      cx += (x - cx) * 0.22;
      cy += (y - cy) * 0.22;
      cur.style.transform = `translate(${cx}px, ${cy}px)`;
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  document.addEventListener('mouseover', (e) => {
    cur.classList.toggle('big', Boolean(e.target.closest('a,button,summary,.tilt,.card')));
  });
}

if (!reducedMotion) {
  $('.mag').forEach((b) => {
    b.addEventListener('mousemove', (e) => {
      const r = b.getBoundingClientRect();
      b.style.setProperty('--mx', `${(e.clientX - r.left - r.width / 2) * 0.22}px`);
      b.style.setProperty('--my', `${(e.clientY - r.top - r.height / 2) * 0.35}px`);
    });
    b.addEventListener('mouseleave', () => {
      b.style.setProperty('--mx', '0px');
      b.style.setProperty('--my', '0px');
    });
  });
}

const art = $('.art')[0];
const tilt = $('.tilt')[0];
const deck = $('.deck')[0];
const tc = document.getElementById('tc');
if (art && tilt && deck) {
  if (!reducedMotion) {
    art.addEventListener('mousemove', (e) => {
      const r = art.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      tilt.style.setProperty('--px', `${nx * 30}px`);
      tilt.style.setProperty('--py', `${ny * 30}px`);
      tilt.style.setProperty('--ry', `${nx * 16}deg`);
      tilt.style.setProperty('--rx', `${-ny * 16}deg`);
    });
    art.addEventListener('mouseleave', () => {
      ['--px', '--py'].forEach((k) => tilt.style.setProperty(k, '0px'));
      ['--rx', '--ry'].forEach((k) => tilt.style.setProperty(k, '0deg'));
    });
  }
  let tricks = 0;
  const flip = () => {
    if (deck.classList.contains('flip')) return;
    if (reducedMotion) {
      if (tc) tc.textContent = String(++tricks);
      return;
    }
    deck.classList.add('flip');
    deck.addEventListener(
      'animationend',
      () => {
        deck.classList.remove('flip');
        if (tc) tc.textContent = String(++tricks);
      },
      { once: true }
    );
  };
  tilt.addEventListener('click', flip);
  tilt.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      flip();
    }
  });
}

const themeButtons = $('[data-theme-toggle]');
const syncThemeButtons = () => {
  const neg = getTheme() === 'negative';
  themeButtons.forEach((btn) => {
    btn.setAttribute('aria-pressed', String(neg));
    btn.textContent = neg ? '◐ Positive' : '◑ Negative';
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

const inlineCopy = document.querySelector('[data-inline-copy]');
if (inlineCopy) {
  inlineCopy.addEventListener('click', async () => {
    const hash = document.querySelector('[data-inline-hash]')?.textContent || '';
    if (!hash) return;
    try {
      await navigator.clipboard.writeText(hash);
      const prev = inlineCopy.textContent;
      inlineCopy.textContent = 'Copied';
      setTimeout(() => {
        inlineCopy.textContent = prev;
      }, 1800);
    } catch {
      /* ignore */
    }
  });
}

let currentRelease = null;
const smart = initSmartDownload({ getRelease: () => currentRelease });

mountWheel({
  mode: 'desktop',
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

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    root.dataset.tabHidden = '1';
  } else {
    delete root.dataset.tabHidden;
  }
});
