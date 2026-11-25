/* Copyright (c) 2026 itsmectrl. All Rights Reserved. */
const LANG_PREF_KEY = 'a2k_lang';
const BANNER_DISMISSED_KEY = 'a2k_banner_dismissed';
export function formatTemplate(template, values) {
    return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key) => {
        return Object.prototype.hasOwnProperty.call(values, key)
            ? (values[key] ?? match)
            : match;
    });
}
function resolveNumberedLocale(localeCode) {
    return localeCode.startsWith('ar') ? `${localeCode}-u-nu-latn` : localeCode;
}
export function formatReleaseDate(isoDate, localeCode) {
    if (!isoDate)
        return '';
    const parsed = new Date(isoDate);
    if (Number.isNaN(parsed.getTime()))
        return '';
    try {
        const dtf = new Intl.DateTimeFormat(resolveNumberedLocale(localeCode), {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        const formatted = dtf.format(parsed);
        const daysDiff = Math.round((parsed.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (Math.abs(daysDiff) <= 14 && typeof Intl.RelativeTimeFormat === 'function') {
            const rtf = new Intl.RelativeTimeFormat(resolveNumberedLocale(localeCode), {
                numeric: 'auto'
            });
            if (daysDiff === 0) {
                return `${formatted} (${rtf.format(0, 'day')})`;
            }
            return `${formatted} (${rtf.format(daysDiff, 'day')})`;
        }
        return formatted;
    }
    catch {
        return isoDate.slice(0, 10);
    }
}
export function formatApkSize(bytes, localeCode) {
    if (!Number.isFinite(bytes) || bytes <= 0)
        return '';
    const locale = resolveNumberedLocale(localeCode);
    const numFmt = new Intl.NumberFormat(locale, {
        maximumFractionDigits: 1,
        minimumFractionDigits: 1
    });
    if (bytes >= 1024 * 1024) {
        const mb = bytes / (1024 * 1024);
        const unit = localeCode.startsWith('fr')
            ? 'Mo'
            : localeCode.startsWith('ar')
                ? 'MB'
                : 'MB';
        return `${numFmt.format(mb)} ${unit}`;
    }
    const kb = Math.max(1, Math.round(bytes / 1024));
    const intFmt = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
    const unit = localeCode.startsWith('fr') ? 'Ko' : 'KB';
    return `${intFmt.format(kb)} ${unit}`;
}
export function formatItemCount(count, localeCode) {
    try {
        const rules = new Intl.PluralRules(resolveNumberedLocale(localeCode));
        const category = rules.select(count);
        const formatted = new Intl.NumberFormat(resolveNumberedLocale(localeCode)).format(count);
        return `${formatted}:${category}`;
    }
    catch {
        return String(count);
    }
}
function matchSupportedLang(rawTag) {
    const tag = rawTag.trim().toLowerCase();
    if (!tag)
        return null;
    if (tag === 'en' || tag.startsWith('en-'))
        return 'en';
    if (tag === 'fr' || tag.startsWith('fr-'))
        return 'fr';
    if (tag === 'ar' || tag.startsWith('ar-'))
        return 'ar';
    if (tag === 'zh' ||
        tag === 'zh-cn' ||
        tag === 'zh-sg' ||
        tag === 'zh-hans' ||
        tag.startsWith('zh-hans-')) {
        return 'zh-Hans';
    }
    return null;
}
export function initLanguageControls(strings) {
    const switcherLinks = document.querySelectorAll('[data-lang-switch]');
    switcherLinks.forEach((link) => {
        link.addEventListener('click', () => {
            const target = link.dataset.langSwitch;
            if (target) {
                try {
                    localStorage.setItem(LANG_PREF_KEY, target);
                }
                catch {
                    /* ignore storage restrictions */
                }
            }
        });
    });
    let savedLang = null;
    let dismissed = false;
    try {
        savedLang = localStorage.getItem(LANG_PREF_KEY);
        dismissed = sessionStorage.getItem(BANNER_DISMISSED_KEY) === '1';
    }
    catch {
        /* ignore storage restrictions */
    }
    if (dismissed || (savedLang && savedLang === strings.lang)) {
        return;
    }
    const browserPrefs = navigator.languages?.length
        ? navigator.languages
        : [navigator.language];
    let suggested;
    for (const tag of browserPrefs) {
        const matched = matchSupportedLang(tag);
        if (matched) {
            if (matched === strings.lang) {
                return;
            }
            suggested = strings.languages.find((item) => item.code === matched);
            if (suggested)
                break;
        }
    }
    if (!suggested)
        return;
    const banner = document.getElementById('lang-banner');
    const promptEl = document.getElementById('lang-banner-text');
    const linkEl = document.getElementById('lang-banner-cta');
    const closeEl = document.getElementById('lang-banner-close');
    if (!banner || !promptEl || !linkEl || !closeEl)
        return;
    promptEl.textContent = formatTemplate(strings.banner.prompt, {
        language: suggested.label
    });
    linkEl.textContent = formatTemplate(strings.banner.cta, {
        language: suggested.label
    });
    linkEl.href = suggested.href;
    linkEl.setAttribute('hreflang', suggested.code);
    linkEl.setAttribute('lang', suggested.code);
    closeEl.setAttribute('aria-label', strings.banner.dismiss);
    linkEl.addEventListener('click', () => {
        try {
            localStorage.setItem(LANG_PREF_KEY, suggested.code);
        }
        catch {
            /* ignore storage restrictions */
        }
    });
    closeEl.addEventListener('click', () => {
        banner.hidden = true;
        try {
            sessionStorage.setItem(BANNER_DISMISSED_KEY, '1');
        }
        catch {
            /* ignore storage restrictions */
        }
    });
    banner.hidden = false;
}
