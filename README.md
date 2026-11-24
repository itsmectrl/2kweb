# All2K — Download Website

Static download website for **All2K**, a free Android music player by **itsmectrl** (Android 7.0+, developer-signed `.apk` releases, updates inside the app). Hosted independently at `https://itsmectrl.github.io/2kweb/` from the `site/` folder while resolving APK releases from `itsmectrl/All2K-new`.

## Output Structure

All deployable static files live strictly inside `site/`, have zero runtime dependencies on anything in the repository root, and run with no build step:

- `site/index.html` — Desktop experience (`https://itsmectrl.github.io/2kweb/`) with pre-paint mobile routing and `?view=desktop` / `?view=mobile` overrides.
- `site/m/index.html` — Dedicated mobile experience (`https://itsmectrl.github.io/2kweb/m/`) with touch skateboard stage, horizontal highlight carousel, and thumb-zone Click Wheel.
- `site/assets/shared/` — Shared design tokens and self-hosted fonts (`tokens.css`, `fonts/`), release API client (`release.js`), platform download sheet (`platform.js`), SVG QR encoder (`qr.js`), Click Wheel controller (`wheel.js`), Web Audio click toggle (`sound.js`), localization loader (`i18n.js`, `locales/{en,fr,ar}.json`), and SVG icons (`icons/`).
- `site/assets/desktop/` & `site/assets/mobile/` — Experience-specific stylesheets and scripts.
- `site/404.html`, `site/robots.txt`, `site/sitemap.xml`, `site/favicon.svg`, `site/og-image.png` — Fallback, crawler metadata, and social preview assets.

Root documentation files (`README.md`, `DEPLOY.md`, `TESTING.md`, `AUDIT.md`) stay outside `site/`.

## Features

- **Subpath- & custom-domain-safe:** All internal asset URLs and page switches use relative paths (`assets/...`, `m/`, `../`), and QR codes encode the URL computed dynamically from `location.href`.
- **Release resolution:** Queries the GitHub Releases API (`itsmectrl/All2K-new`) with a 4-second `AbortController` timeout, 10-minute `sessionStorage` cache, automatic fallback to `releases/latest`, and optional SHA-256 verification digest display.
- **Smart Download sheet:** Shows a 3-step APK install guide on Android and a QR code + copy/share sheet on desktop browsers.
- **Accessibility & controls:** Positive/Negative monochrome themes, English/French/Arabic (`dir="rtl"`) localization, Click Wheel keyboard/pointer navigation, reduced-motion support, and `<noscript>` fallback links.

## Local Preview & Deployment

- Run `npm run dev` (or serve `site/` directly with any static HTTP server) to preview locally.
- See `DEPLOY.md` for GitHub Pages deployment steps, `TESTING.md` for browser and device verification details, and `AUDIT.md` for the authorship checklist.

---

Made by **itsmectrl** · © 2026 itsmectrl. All Rights Reserved.
