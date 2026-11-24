/* Copyright (c) 2026 itsmectrl. All Rights Reserved. */

export const LATEST_PAGE_URL = 'https://github.com/itsmectrl/All2K-new/releases/latest';
const API_URL = 'https://api.github.com/repos/itsmectrl/All2K-new/releases/latest';
const CACHE_KEY = 'all2k_release_cache_v1';
const CACHE_TTL_MS = 10 * 60 * 1000;
const TIMEOUT_MS = 4000;

let memoryPromise = null;

function readCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.fetchedAt !== 'number') return null;
    if (Date.now() - parsed.fetchedAt > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(payload) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore storage quota or privacy-mode errors */
  }
}

export function fetchLatestRelease() {
  if (memoryPromise) return memoryPromise;

  const cached = readCache();
  if (cached) {
    memoryPromise = Promise.resolve(cached);
    return memoryPromise;
  }

  memoryPromise = (async () => {
    const fallback = {
      tagName: '',
      apkUrl: LATEST_PAGE_URL,
      apkName: '',
      digest: '',
      isDirectApk: false,
      fetchedAt: Date.now()
    };

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(API_URL, {
        headers: { Accept: 'application/vnd.github+json' },
        signal: ctrl.signal
      });
      if (!res.ok) return fallback;
      const data = await res.json();
      const assets = Array.isArray(data.assets) ? data.assets : [];
      const apk = assets.find((a) => a && typeof a.name === 'string' && /\.apk$/i.test(a.name));
      const digest = apk && typeof apk.digest === 'string' ? apk.digest.trim() : '';
      const result = {
        tagName: typeof data.tag_name === 'string' ? data.tag_name : '',
        apkUrl: apk && typeof apk.browser_download_url === 'string' ? apk.browser_download_url : LATEST_PAGE_URL,
        apkName: apk ? apk.name : '',
        digest,
        isDirectApk: Boolean(apk && apk.browser_download_url),
        fetchedAt: Date.now()
      };
      writeCache(result);
      return result;
    } catch {
      return fallback;
    } finally {
      clearTimeout(timer);
    }
  })();

  return memoryPromise;
}

export function applyReleaseLinks(release, root = document) {
  const anchors = root.querySelectorAll('[data-dl]');
  anchors.forEach((a) => {
    a.href = release.apkUrl || LATEST_PAGE_URL;
    if (release.isDirectApk) {
      a.setAttribute('download', release.apkName || 'All2K.apk');
    } else {
      a.removeAttribute('download');
    }
  });

  const metas = root.querySelectorAll('[data-meta]');
  metas.forEach((el) => {
    if (release.tagName) {
      el.dataset.version = release.tagName;
      const tpl = el.dataset.metaWithVersion;
      if (tpl) {
        el.textContent = tpl.replace('{tag}', release.tagName);
      } else {
        el.textContent = `Latest ${release.tagName} · Android · Free download`;
      }
    }
  });
}
