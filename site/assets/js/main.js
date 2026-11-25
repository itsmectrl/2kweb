/* Copyright (c) 2026 itsmectrl. All Rights Reserved. */
import { initLanguageControls } from './i18n-runtime.js';
import { initPod } from './pod.js';
import { initReleaseInfo } from './release.js';
import { copyWithFeedback, initUi } from './ui.js';
function boot() {
    const payloadEl = document.getElementById('i18n-data');
    if (!payloadEl || !payloadEl.textContent)
        return;
    let strings;
    try {
        strings = JSON.parse(payloadEl.textContent);
    }
    catch {
        return;
    }
    initUi(strings);
    initLanguageControls(strings);
    const pod = initPod(strings);
    initReleaseInfo(strings, (tag) => pod.setTag(tag), (text, btn) => copyWithFeedback(text, btn, strings.hero.copied));
}
boot();
