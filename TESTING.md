# Testing Report — All2K Static Website

## 1. What Was Tested and Verified

### Automated Static & Asset Checks
- **QR Code Encoder (`site/assets/shared/qr.js`)**: Verified with the independent `jsqr` decoder across Versions 1, 2, 3, 4, 6, 7, and 10 (short, medium, subpath, and long query-string URLs). Every generated QR matrix decoded back to the exact input URL.
- **Mobile Payload Size**: Measured raw and gzipped sizes of `site/m/index.html`, `tokens.css`, `mobile.css`, `mobile.js`, and all shared JS modules (excluding self-hosted `.woff2` fonts): **96,863 bytes raw / 26.35 KB gzipped** (under the 80 KB budget).
- **Content Security Policy (CSP)**: Verified SHA-256 hashes of the inline `<head>` router scripts in both `site/index.html` and `site/m/index.html` match their `<meta http-equiv="Content-Security-Policy">` directives with zero console or CSP errors.
- **Path, URL & Copy Audit**: Verified zero forbidden strings (`originostudio`, `All2K-1`), zero old `All2K-new` GitHub Pages site URLs, zero root-relative asset URLs inside `site/`, and confirmed all APK/API release links remain on `itsmectrl/All2K-new`.
- **OpenGraph Image (`site/og-image.png`)**: Verified PNG signature, `IHDR`/`IDAT`/`IEND` chunks only, and exact `1200 × 630` pixel dimensions in strict black and white.

### Automated Headless Chromium (Playwright) Checks
Served `site/` standalone (with zero access to repo root files) under both the GitHub Pages subpath `/2kweb/` and a root custom domain `/`:
- **Routing, 404 & Overrides**:
  - Desktop (`1440×900`) and tablet landscape (`1024×768`, touch enabled) stayed on `/2kweb/`.
  - Phone viewports automatically redirected before first paint to `/2kweb/m/` (and `/m/` under root custom domain).
  - `?view=desktop` from `/m/` redirected to `/2kweb/?view=desktop` without looping.
  - Missing paths under `/2kweb/` served `site/404.html` with `#home-link` pointing back to `/2kweb/`.
- **SEO & Social Metadata**:
  - Verified `<link rel="canonical">`, `<link rel="alternate">`, `og:url`, `og:image`, and `twitter:*` tags point to `https://itsmectrl.github.io/2kweb/`.
- **Zero Overflow, Zero Overlapping Interactive Elements, & Tap Targets (`>= 47–48px`)**:
  - Desktop `1440×900`: PASS (`0` overflows, `0` overlaps).
  - Foldable `280×653`: PASS.
  - Mobile `320×568`, `360×640`, `360×800`, `375×667`, `390×844`, `412×915`, `430×932`: PASS (`0` overflows, `0` overlaps, footer `Desktop site` link clear of docked Click Wheel).
  - Mobile landscape `844×390`: PASS (Click Wheel automatically collapsed to mini-wheel; footer clear).
  - `390×844` at `200%` root font size (`32px`): PASS (`0` overflows, `0` overlaps).
- **Interactive Features**:
  - Click Wheel keyboard `ArrowDown` rotation scrolled the page; `MENU` opened the Wheel Menu sheet; Negative mode toggled `data-theme="negative"`.
  - Mobile skateboard Kickflip & Shove-it triggers incremented trick counter and displayed `COMBO x2`.
  - i18n switched cleanly to Arabic (`dir="rtl"`) and French.
  - Smart Download sheet:
    - Desktop / non-Android showed `"All2K is for Android"`, rendered the SVG QR code encoding the URL computed from `location.href` (verified for both `/2kweb/` and root `/`), and provided Copy link.
    - Android User-Agent showed `"APK download started"` with the 3-step install guide.
    - Mocked GitHub API response (`itsmectrl/All2K-new/releases/latest`) with `digest` revealed the collapsible `"Verify your download"` SHA-256 box; response without `digest` kept it hidden.
- **Progressive Enhancement (JavaScript Disabled)**:
  - Verified `/2kweb/m/` with JS disabled displays the `<noscript>` download link and keeps all sections (including FAQ) visible and accessible.
- **Release Fallback (`site/assets/shared/release.js`)**:
  - Verified in Node that aborted/failed fetches cleanly fall back to `https://github.com/itsmectrl/All2K-new/releases/latest`.

## 2. What Could Not Be Tested Here

- **Lighthouse Audit Scores**: Lighthouse CLI was not installed/executed in this environment, so exact Lighthouse Performance / Accessibility / Best Practices / SEO numeric scores are not measured here.
- **Live `api.github.com` Production Release Payload**: Playwright browser tests mocked `https://api.github.com/repos/itsmectrl/All2K-new/releases/latest`; live GitHub release rate limits, real `.apk` download streaming, and real SHA-256 `digest` field presence depend on your published GitHub Release on `itsmectrl/All2K-new`.
- **Physical Device Hardware**: Real Android Chrome (APK install intent, `navigator.vibrate(8)`, Web Audio click sound, Web Share API sheet, virtual keyboard resize) and physical iOS Safari (`env(safe-area-inset-bottom)` notch behavior, QR camera scanning) were not tested on physical hardware.
- **200% Native Browser Pinch/Page Zoom**: Simulated `200%` text scaling via root `font-size: 32px` in Chromium; native OS/browser pinch-zoom was not tested on device.
