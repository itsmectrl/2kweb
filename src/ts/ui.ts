/* Copyright (c) 2026 itsmectrl. All Rights Reserved. */
import type { ClientStrings } from './types.js';

export function copyWithFeedback(
  text: string,
  button: HTMLButtonElement,
  copiedLabel: string
): void {
  const original = button.textContent ?? '';
  const showDone = (): void => {
    button.textContent = copiedLabel;
    window.setTimeout(() => {
      button.textContent = original;
    }, 1500);
  };

  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    navigator.clipboard
      .writeText(text)
      .then(showDone)
      .catch(() => {
        fallbackCopy(text, showDone);
      });
    return;
  }

  fallbackCopy(text, showDone);
}

function fallbackCopy(text: string, onDone: () => void): void {
  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    document.body.removeChild(area);
    onDone();
  } catch {
    /* ignore copy failures */
  }
}

export function initUi(strings: ClientStrings): void {
  const isAndroid = /Android/i.test(navigator.userAgent);
  const noteEl = document.getElementById('note');
  const copyLinkBtn = document.getElementById('cl') as HTMLButtonElement | null;

  if (!isAndroid && noteEl) {
    noteEl.hidden = false;
  }

  if (copyLinkBtn) {
    copyLinkBtn.addEventListener('click', () => {
      copyWithFeedback(window.location.href, copyLinkBtn, strings.hero.copied);
    });
  }

  const revealTargets = document.querySelectorAll<HTMLElement>('.rv');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealTargets.forEach((el) => observer.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add('in'));
  }

  const dockEl = document.getElementById('dock');
  if (dockEl) {
    let ticking = false;
    window.addEventListener(
      'scroll',
      () => {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(() => {
          dockEl.classList.toggle('on', window.scrollY > 520);
          ticking = false;
        });
      },
      { passive: true }
    );
  }

  const conn = (navigator as unknown as { connection?: { saveData?: boolean } }).connection;
  if (conn?.saveData) {
    document.documentElement.classList.add('save-data');
  }

  const syncVisibility = (): void => {
    document.documentElement.classList.toggle('paused', document.hidden);
  };
  document.addEventListener('visibilitychange', syncVisibility);
  syncVisibility();
}
