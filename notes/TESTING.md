<!-- Copyright (c) 2026 itsmectrl. All Rights Reserved. -->
# Verification & Testing Summary

## Automated Checks (`npm run check` & `npm run lint`)

Executed after final build edits with exit code `0`:

- **TypeScript (`npm run lint`)**: Passed `tsc --noEmit` and `tsc -p tsconfig.client.json --noEmit` with strict settings and `noUncheckedIndexedAccess` enabled.
- **i18n Parity & LCD Length (`scripts/check.mjs`)**: Verified identical JSON key paths, identical `{placeholder}` tokens, non-empty strings, and all `.short` LCD strings `<= 18` characters across `en.json`, `fr.json`, `ar.json`, and `zh.json`.
- **SEO, Links, & Static Security (`scripts/check.mjs`)**: Verified `<html lang dir>`, `<meta name="author" content="itsmectrl">`, reciprocal `hreflang` tags (`en`, `fr`, `ar`, `zh-Hans`, `x-default`), zero root-absolute internal paths, zero inline event handlers, zero source maps, clean PNG chunk headers (no `tEXt`/`zTXt`/`iTXt`/`eXIf`), and copyright headers across all source and output files in `site/`.
- **Gzip Payload Budgets (`HTML + CSS + JS`)**:
  - `index.html` (`en`): `14.8 KB` gzip (`< 80 KB` limit)
  - `fr/index.html` (`fr`): `15.0 KB` gzip (`< 80 KB` limit)
  - `ar/index.html` (`ar`): `15.2 KB` gzip (`< 80 KB` limit)
  - `zh/index.html` (`zh-Hans`): `15.2 KB` gzip (`< 80 KB` limit)

## Browser & Responsive Matrix (Playwright Chromium)

Verified across `/` (`en`), `/fr/`, `/ar/`, and `/zh/` served under `/2kweb/` prefix:

- **Viewports with zero horizontal or LCD overflow**: `320x568`, `360x800`, `390x844`, `430x932`, `844x390`, `1440x900` across all 4 languages, plus `200%` text size scaling check at `1440x900`.
- **Release API Integration (mocked GitHub Releases payload)**: Verified updated download links, localized `Intl.DateTimeFormat` + `Intl.RelativeTimeFormat` + `Intl.NumberFormat` size formatting, `#vf` SHA-256 reveal, and localized iPod LCD footer.
- **Interactive Controls**: Tested `#sound-toggle` mute switch (`false` default -> `true` on click), wheel `#bn`/`#bc`/`#bm` buttons, keyboard arrow focus navigation on `#wheel`, non-Android `#note` banner visibility vs. Android UA hidden state, and French-locale browser banner prompt (`lang-banner`) on the English page.
- **No-JavaScript Progressive Enhancement**: Verified pre-rendered Arabic DOM and direct fallback release link (`releases/latest`) with JavaScript disabled.

## Environment Limitations / Not Run

- **Lighthouse CLI**: Not installed in this build environment (`which lighthouse` returned empty), so automated Lighthouse scores were not measured locally.
- **Real Hardware / Network Conditions**: Native iOS Safari, Android Chrome APK install flow, and live unmocked font rendering on macOS/Windows CJK hosts require testing on target devices after deploy.
