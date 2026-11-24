/* Copyright (c) 2026 itsmectrl. All Rights Reserved. */

const LANG_KEY = 'all2k_lang';
const SUPPORTED = ['en', 'fr', 'ar'];
const cache = new Map();
const listeners = new Set();

let currentLang = 'en';
let currentDict = {};

try {
  const saved = localStorage.getItem(LANG_KEY);
  if (saved && SUPPORTED.includes(saved)) {
    currentLang = saved;
  }
} catch {
  /* ignore */
}

export function getLang() {
  return currentLang;
}

export function t(key, fallback = '') {
  return currentDict[key] || fallback || key;
}

export function onLangChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export async function loadLanguage(lang, { apply = true } = {}) {
  const target = SUPPORTED.includes(lang) ? lang : 'en';
  if (!cache.has(target)) {
    try {
      const url = new URL(`./locales/${target}.json`, import.meta.url);
      const res = await fetch(url);
      if (res.ok) {
        cache.set(target, await res.json());
      }
    } catch {
      /* keep inline dom copy when locale fetch fails */
    }
  }

  currentLang = target;
  currentDict = cache.get(target) || {};
  try {
    localStorage.setItem(LANG_KEY, target);
  } catch {
    /* ignore */
  }

  document.documentElement.lang = target;
  document.documentElement.dir = target === 'ar' ? 'rtl' : 'ltr';

  if (apply) {
    applyTranslations();
  }
  listeners.forEach((fn) => fn(target, currentDict));
  return currentDict;
}

export function applyTranslations(root = document) {
  if (!Object.keys(currentDict).length) return;

  root.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    if (key && currentDict[key]) {
      el.textContent = currentDict[key];
    }
  });

  root.querySelectorAll('[data-meta]').forEach((el) => {
    if (el.dataset.version && currentDict['hero.metaVersion']) {
      el.textContent = currentDict['hero.metaVersion'].replace('{tag}', el.dataset.version);
    } else if (!el.dataset.version && currentDict['hero.meta']) {
      el.textContent = currentDict['hero.meta'];
    }
    if (currentDict['hero.metaVersion']) {
      el.dataset.metaWithVersion = currentDict['hero.metaVersion'];
    }
  });
}

export async function initI18n() {
  if (currentLang !== 'en') {
    await loadLanguage(currentLang, { apply: true });
  }
}
