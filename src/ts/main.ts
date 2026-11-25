/* Copyright (c) 2026 itsmectrl. All Rights Reserved. */
import { initLanguageControls } from './i18n-runtime.js';
import { initPod } from './pod.js';
import { initReleaseInfo } from './release.js';
import type { ClientStrings } from './types.js';
import { copyWithFeedback, initUi } from './ui.js';

function boot(): void {
  const payloadEl = document.getElementById('i18n-data');
  if (!payloadEl || !payloadEl.textContent) return;

  let strings: ClientStrings;
  try {
    strings = JSON.parse(payloadEl.textContent) as ClientStrings;
  } catch {
    return;
  }

  initUi(strings);
  initLanguageControls(strings);
  const pod = initPod(strings);
  initReleaseInfo(
    strings,
    (tag) => pod.setTag(tag),
    (text, btn) => copyWithFeedback(text, btn, strings.hero.copied)
  );
}

boot();
