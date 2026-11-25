/* Copyright (c) 2026 itsmectrl. All Rights Reserved. */
import {
  formatApkSize,
  formatReleaseDate,
  formatTemplate
} from './i18n-runtime.js';
import type { ClientStrings, ReleaseInfo } from './types.js';

const API_URL = 'https://api.github.com/repos/itsmectrl/All2K-new/releases/latest';
const FALLBACK_URL = 'https://github.com/itsmectrl/All2K-new/releases/latest';
const CACHE_KEY = 'a2k_rel_v1';
const CACHE_TTL_MS = 10 * 60 * 1000;
const TIMEOUT_MS = 4000;

interface GitHubAsset {
  name?: string;
  browser_download_url?: string;
  digest?: string;
  size?: number;
}

interface GitHubReleaseResponse {
  tag_name?: string;
  published_at?: string;
  assets?: GitHubAsset[];
}

interface CachedRelease {
  t: number;
  d: ReleaseInfo;
}

function readCachedRelease(): ReleaseInfo | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedRelease | null;
    if (!parsed || typeof parsed.t !== 'number' || !parsed.d) return null;
    if (Date.now() - parsed.t >= CACHE_TTL_MS) return null;
    return parsed.d;
  } catch {
    return null;
  }
}

function writeCachedRelease(info: ReleaseInfo): void {
  try {
    const payload: CachedRelease = { t: Date.now(), d: info };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore storage restrictions */
  }
}

export function initReleaseInfo(
  strings: ClientStrings,
  onMetaUpdate: (tag: string) => void,
  copyText: (text: string, button: HTMLButtonElement) => void
): void {
  const apply = (info: ReleaseInfo): void => {
    const targetUrl = info.url || FALLBACK_URL;
    document.querySelectorAll<HTMLAnchorElement>('[data-dl]').forEach((anchor) => {
      anchor.href = targetUrl;
    });

    if (info.tag) {
      const dateStr = formatReleaseDate(info.publishedAt, strings.localeCode);
      const sizeStr = formatApkSize(info.size, strings.localeCode);

      const metaLine =
        dateStr && sizeStr
          ? formatTemplate(strings.hero.metaLoaded, {
              tag: info.tag,
              date: dateStr,
              size: sizeStr
            })
          : formatTemplate(strings.hero.metaTagOnly, {
              tag: info.tag
            });

      document.querySelectorAll<HTMLElement>('[data-meta]').forEach((el) => {
        el.textContent = metaLine;
      });

      onMetaUpdate(info.tag);
    }

    if (info.digest) {
      const hashEl = document.getElementById('hash');
      const verifyBox = document.getElementById('vf');
      const copyHashBtn = document.getElementById('ch') as HTMLButtonElement | null;
      const cleanDigest = info.digest.replace(/^sha256:/i, '');
      if (hashEl && verifyBox && cleanDigest) {
        hashEl.textContent = cleanDigest;
        verifyBox.hidden = false;
        if (copyHashBtn) {
          copyHashBtn.addEventListener('click', () => {
            copyText(cleanDigest, copyHashBtn);
          });
        }
      }
    }
  };

  const cached = readCachedRelease();
  if (cached) {
    apply(cached);
    return;
  }

  void (async () => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetch(API_URL, {
        signal: controller.signal,
        headers: { Accept: 'application/vnd.github+json' }
      });
      window.clearTimeout(timer);
      if (!response.ok) return;

      const json = (await response.json()) as GitHubReleaseResponse;
      const apkAsset = (json.assets ?? []).find((asset) =>
        typeof asset.name === 'string' && /\.apk$/i.test(asset.name)
      );

      const info: ReleaseInfo = {
        tag: typeof json.tag_name === 'string' ? json.tag_name : '',
        url:
          apkAsset && typeof apkAsset.browser_download_url === 'string'
            ? apkAsset.browser_download_url
            : '',
        digest:
          apkAsset && typeof apkAsset.digest === 'string' ? apkAsset.digest : '',
        size: apkAsset && typeof apkAsset.size === 'number' ? apkAsset.size : 0,
        publishedAt:
          typeof json.published_at === 'string' ? json.published_at : ''
      };

      writeCachedRelease(info);
      apply(info);
    } catch {
      window.clearTimeout(timer);
    }
  })();
}
