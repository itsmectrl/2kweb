/* Copyright (c) 2026 itsmectrl. All Rights Reserved. */

import { createQrSvg } from './qr.js';
import { LATEST_PAGE_URL } from './release.js';
import { t } from './i18n.js';

const THEME_KEY = 'all2k_theme';

export function isAndroidDevice() {
  const ua = navigator.userAgent || '';
  if (/Android/i.test(ua)) return true;
  if (navigator.userAgentData && navigator.userAgentData.platform === 'Android') return true;
  return false;
}

export function getTheme() {
  return document.documentElement.dataset.theme === 'negative' ? 'negative' : 'positive';
}

export function setTheme(mode) {
  const next = mode === 'negative' ? 'negative' : 'positive';
  document.documentElement.dataset.theme = next;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', next === 'negative' ? '#f3f3f0' : '#0a0a0a');
  }
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {
    /* ignore */
  }
  document.dispatchEvent(new CustomEvent('all2k:themechange', { detail: { theme: next } }));
  return next;
}

export function toggleTheme() {
  return setTheme(getTheme() === 'negative' ? 'positive' : 'negative');
}

export function getShareSiteUrl() {
  try {
    const u = new URL(location.href);
    u.search = '';
    u.hash = '';
    return u.href;
  } catch {
    return location.href;
  }
}

export function initSmartDownload({ getRelease }) {
  let activeBackdrop = null;
  let lastTrigger = null;

  function closeSheet() {
    if (!activeBackdrop) return;
    activeBackdrop.remove();
    activeBackdrop = null;
    document.removeEventListener('keydown', onEsc);
    if (lastTrigger && typeof lastTrigger.focus === 'function') {
      lastTrigger.focus();
    }
  }

  function onEsc(e) {
    if (e.key === 'Escape') closeSheet();
  }

  function openDownloadSheet(trigger = null) {
    closeSheet();
    lastTrigger = trigger;
    const release = getRelease();
    const android = isAndroidDevice();
    const shareUrl = getShareSiteUrl();
    const apkHref = (release && release.apkUrl) || LATEST_PAGE_URL;

    const backdrop = document.createElement('div');
    backdrop.className = 'sheet-backdrop';
    backdrop.setAttribute('role', 'dialog');
    backdrop.setAttribute('aria-modal', 'true');
    backdrop.setAttribute('aria-labelledby', 'dl-sheet-title');

    const panel = document.createElement('div');
    panel.className = 'sheet-panel';

    const head = document.createElement('div');
    head.className = 'sheet-head';

    const title = document.createElement('h2');
    title.id = 'dl-sheet-title';
    title.className = 'sheet-title';
    title.textContent = android
      ? t('dl.androidTitle', 'APK download started')
      : t('dl.otherTitle', 'All2K is for Android');

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'sheet-close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', closeSheet);

    head.append(title, closeBtn);
    panel.append(head);

    const sub = document.createElement('p');
    sub.textContent = android
      ? t('dl.androidSub', 'Follow these three steps on your Android device:')
      : t('dl.otherSub', 'Scan this QR code with your Android phone or send the link over.');
    panel.append(sub);

    if (android) {
      const list = document.createElement('ol');
      list.className = 'install-guide';
      const steps = [
        t('dl.step1', 'Open the downloaded .apk file from your notifications or Downloads.'),
        t('dl.step2', 'Allow installs from your browser if Android asks.'),
        t('dl.step3', 'Tap Install, then open All2K.')
      ];
      steps.forEach((txt) => {
        const li = document.createElement('li');
        const span = document.createElement('span');
        span.textContent = txt;
        li.append(span);
        list.append(li);
      });
      panel.append(list);

      const actions = document.createElement('div');
      actions.className = 'sheet-actions';
      const retry = document.createElement('a');
      retry.className = 'action-btn';
      retry.href = apkHref;
      retry.textContent = release?.tagName ? `${t('hero.cta', 'Download APK')} (${release.tagName})` : t('hero.cta', 'Download APK');
      actions.append(retry);
      panel.append(actions);
    } else {
      const qrBox = document.createElement('div');
      qrBox.className = 'qr-box';
      const qrFrame = document.createElement('div');
      qrFrame.className = 'qr-frame';
      try {
        qrFrame.append(createQrSvg(shareUrl, { label: `QR code for ${shareUrl}`, sizePx: 176 }));
      } catch {
        /* keep copy and share controls available if url exceeds v10 capacity */
      }
      const qrUrl = document.createElement('small');
      qrUrl.textContent = shareUrl;
      qrUrl.style.wordBreak = 'break-all';
      qrUrl.style.fontSize = '11px';
      qrUrl.style.textAlign = 'center';
      qrBox.append(qrFrame, qrUrl);
      panel.append(qrBox);

      const actions = document.createElement('div');
      actions.className = 'sheet-actions';

      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'action-btn';
      copyBtn.textContent = t('dl.copyLink', 'Copy link');
      copyBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(shareUrl);
          copyBtn.textContent = t('dl.copied', 'Copied');
          setTimeout(() => {
            copyBtn.textContent = t('dl.copyLink', 'Copy link');
          }, 1800);
        } catch {
          /* ignore */
        }
      });
      actions.append(copyBtn);

      if (typeof navigator.share === 'function') {
        const shareBtn = document.createElement('button');
        shareBtn.type = 'button';
        shareBtn.className = 'action-btn is-outline';
        shareBtn.textContent = t('dl.share', 'Share');
        shareBtn.addEventListener('click', async () => {
          try {
            await navigator.share({
              title: 'All2K for Android',
              text: 'Download All2K for Android',
              url: shareUrl
            });
          } catch {
            /* user cancelled */
          }
        });
        actions.append(shareBtn);
      }
      panel.append(actions);

      const anyway = document.createElement('a');
      anyway.className = 'dl-anyway';
      anyway.href = apkHref;
      anyway.textContent = t('dl.anyway', 'Download APK anyway');
      panel.append(anyway);
    }

    if (release && release.digest) {
      const details = document.createElement('details');
      details.className = 'verify-box';
      const summary = document.createElement('summary');
      summary.textContent = t('dl.verify', 'Verify your download');
      const plus = document.createElement('span');
      plus.setAttribute('aria-hidden', 'true');
      plus.textContent = '+';
      summary.append(plus);

      const hashEl = document.createElement('div');
      hashEl.className = 'verify-hash';
      hashEl.textContent = release.digest;

      const copyHashBtn = document.createElement('button');
      copyHashBtn.type = 'button';
      copyHashBtn.className = 'action-btn is-outline';
      copyHashBtn.style.marginTop = '10px';
      copyHashBtn.style.width = '100%';
      copyHashBtn.textContent = t('dl.copyHash', 'Copy SHA-256');
      copyHashBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(release.digest);
          copyHashBtn.textContent = t('dl.copied', 'Copied');
          setTimeout(() => {
            copyHashBtn.textContent = t('dl.copyHash', 'Copy SHA-256');
          }, 1800);
        } catch {
          /* ignore */
        }
      });

      details.append(summary, hashEl, copyHashBtn);
      panel.append(details);
    }

    backdrop.append(panel);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeSheet();
    });
    document.body.append(backdrop);
    activeBackdrop = backdrop;
    document.addEventListener('keydown', onEsc);
    closeBtn.focus();
  }

  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-dl]');
    if (!link) return;
    const release = getRelease();
    const android = isAndroidDevice();
    if (!android) {
      e.preventDefault();
      openDownloadSheet(link);
    } else if (release && release.isDirectApk) {
      // let native download start while showing install steps
      openDownloadSheet(link);
    } else {
      // keep page open and show direct link when no apk asset was resolved
      e.preventDefault();
      openDownloadSheet(link);
    }
  });

  function syncInlineSmartUI() {
    const notice = document.querySelector('[data-platform-note]');
    if (notice) {
      notice.hidden = isAndroidDevice();
    }
    const release = getRelease();
    const inlineVerify = document.querySelector('[data-inline-verify]');
    if (inlineVerify) {
      if (release && release.digest) {
        inlineVerify.hidden = false;
        const hashNode = inlineVerify.querySelector('[data-inline-hash]');
        if (hashNode) hashNode.textContent = release.digest;
      } else {
        inlineVerify.hidden = true;
      }
    }
  }

  return {
    openDownloadSheet,
    closeSheet,
    syncInlineSmartUI
  };
}
