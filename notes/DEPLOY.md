<!-- Copyright (c) 2026 itsmectrl. All Rights Reserved. -->
# Deployment Guide

This repository publishes static output strictly from `site/` via `.github/workflows/pages.yml` to:

`https://itsmectrl.github.io/2kweb/`

## Project Structure

- `src/i18n/{en,fr,ar,zh}.json` — Multilingual copy sources
- `src/template.html` & `src/404.template.html` — Static page templates
- `src/styles/main.css` — Single-file stylesheet copied to `site/assets/css/style.css`
- `src/ts/*.ts` — Strict client TypeScript modules compiled directly by `tsc` (`tsconfig.client.json`) to `site/assets/js/*.js`
- `scripts/config.mjs` — Single definition of `BASE_URL` and locale map
- `scripts/build-og.mjs` — Generates metadata-stripped `1200x630` black-and-white OG PNGs into `src/assets/og/`
- `scripts/build.mjs` — Compiles TS, copies assets, renders `site/`, generates `sitemap.xml` and `robots.txt`
- `scripts/check.mjs` — Verifies key/placeholder parity, LCD limits, `hreflang`, relative URLs, gzip asset budget (`<= 80 KB`), authorship headers, PNG cleanliness, and viewport overflow
- `site/` — Self-contained static output deployed by GitHub Pages

## Commands

```bash
npm run build:og   # Optional: regenerate 1200x630 og-{en,fr,ar,zh}.png into src/assets/og/
npm run build      # Compile TypeScript + generate all HTML/CSS/JS/XML pages into site/
npm run check      # Run localization, SEO, gzip budget, authorship, and Playwright overflow checks
npm run lint       # Run strict TypeScript type-checking
npm run dev        # Preview site/ locally on port 3000 (/ and /2kweb/)
```

## Subpath & Custom Domain Behavior

- Only canonical/alternate SEO tags, OpenGraph tags, `sitemap.xml`, and `robots.txt` use `BASE_URL` from `scripts/config.mjs`.
- All internal asset references (`assets/css/style.css`, `assets/js/main.js`, `assets/img/favicon.svg`) and language-switcher links (`fr/`, `../`, etc.) are relative, so the built `site/` works both at `/2kweb/` on GitHub Pages and at `/` if moved to a custom domain later.
- To update the published base URL, change `BASE_URL` once in `scripts/config.mjs`, run `npm run build && npm run check`, and commit `site/`.

## Publishing Cleanup

Before pushing `site/` publicly, you may remove `/notes/` (`rm -rf notes/`) without affecting the build or deployment workflow.
