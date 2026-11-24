# Deploying All2K to GitHub Pages

This guide explains how to deploy the contents of `site/` to the `itsmectrl/All2K-new` repository on GitHub Pages.

## 1. Files to Copy

Copy everything **inside** `site/` into the root of your `itsmectrl/All2K-new` repository on the `main` branch:

- `index.html`
- `m/index.html`
- `assets/shared/` (`tokens.css`, `release.js`, `platform.js`, `qr.js`, `wheel.js`, `sound.js`, `i18n.js`, `fonts/`, `icons/`, `locales/`)
- `assets/desktop/` (`desktop.css`, `desktop.js`)
- `assets/mobile/` (`mobile.css`, `mobile.js`)
- `404.html`
- `robots.txt`
- `sitemap.xml`
- `favicon.svg`
- `og-image.png`

## 2. Files NOT to Overwrite

Do **not** overwrite or delete existing repository files generated outside the website:

- `README.md`
- `version.json` (written by your release pipeline)
- Any release assets or `.apk` artifacts

## 3. Enable GitHub Pages

1. Push your changes to the `main` branch of `itsmectrl/All2K-new`.
2. Open the repository on GitHub and go to **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **Deploy from a branch**.
4. Select branch **`main`** and folder **`/ (root)`**, then click **Save**.
5. Wait for the `pages build and deployment` workflow to finish.

## 4. URLs to Check After Deployment

Verify all of the following URLs after deployment:

- Desktop experience: `https://itsmectrl.github.io/All2K-new/`
- Mobile experience: `https://itsmectrl.github.io/All2K-new/m/`
- Forced desktop view on a phone: `https://itsmectrl.github.io/All2K-new/?view=desktop`
- Forced mobile view on a desktop browser: `https://itsmectrl.github.io/All2K-new/?view=mobile`
- 404 fallback page: `https://itsmectrl.github.io/All2K-new/does-not-exist`
- OpenGraph image: `https://itsmectrl.github.io/All2K-new/og-image.png`
- Sitemap & robots: `https://itsmectrl.github.io/All2K-new/sitemap.xml` and `https://itsmectrl.github.io/All2K-new/robots.txt`

### Custom Domain Note

All internal asset paths and page switches are relative (`assets/...`, `m/`, `../`). If you attach a custom domain later in **Settings → Pages**, the site works without modifying any HTML, CSS, or JavaScript files (you only need to update the `<loc>` URLs in `sitemap.xml` if you want canonical sitemap entries on the new domain).
