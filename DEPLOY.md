# Deploying All2K to GitHub Pages

This guide explains how to host the static website inside `site/` from the `itsmectrl/2kweb` repository on GitHub Pages (`https://itsmectrl.github.io/2kweb/`). APK downloads and release metadata continue to point to `itsmectrl/All2K-new/releases/latest`.

## 1. Static Output Folder (`site/`)

The website is self-contained inside `site/` and has zero runtime dependencies on anything in the repository root:

- `site/index.html`
- `site/m/index.html`
- `site/assets/shared/` (`tokens.css`, `release.js`, `platform.js`, `qr.js`, `wheel.js`, `sound.js`, `i18n.js`, `fonts/`, `icons/`, `locales/`)
- `site/assets/desktop/` (`desktop.css`, `desktop.js`)
- `site/assets/mobile/` (`mobile.css`, `mobile.js`)
- `site/404.html`
- `site/robots.txt`
- `site/sitemap.xml`
- `site/favicon.svg`
- `site/og-image.png`

## 2. Publish `site/` on GitHub Pages

### Option A: GitHub Actions (Recommended when serving from `site/`)
1. Open `itsmectrl/2kweb` on GitHub and go to **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. Deploy the `site/` directory directly (for example via `actions/upload-pages-artifact` with `path: site`).

### Option B: Branch Root (`gh-pages` or `main`)
1. Copy the contents **inside** `site/` into the root of your Pages branch.
2. In **Settings → Pages**, select **Deploy from a branch** and choose `/ (root)`.
3. Do not overwrite any existing non-site files such as `README.md`, `version.json`, or release artifacts if publishing to a shared branch.

## 3. URLs to Check After Deployment

Verify all of the following URLs after deployment:

- Desktop experience: `https://itsmectrl.github.io/2kweb/`
- Mobile experience: `https://itsmectrl.github.io/2kweb/m/`
- Forced desktop view on a phone: `https://itsmectrl.github.io/2kweb/?view=desktop`
- Forced mobile view on a desktop browser: `https://itsmectrl.github.io/2kweb/?view=mobile`
- 404 fallback page: `https://itsmectrl.github.io/2kweb/does-not-exist`
- OpenGraph image: `https://itsmectrl.github.io/2kweb/og-image.png`
- Sitemap & robots: `https://itsmectrl.github.io/2kweb/sitemap.xml` and `https://itsmectrl.github.io/2kweb/robots.txt`

### Custom Domain Note

All internal asset paths, page switches, and the share/QR URL generator are relative or derived from `location.href`. If you attach a custom domain later in **Settings → Pages**, the site functions unchanged; only update the explicit canonical, `og:url`, `og:image`, `twitter:image`, `sitemap.xml`, and `robots.txt` URLs if you want search/social metadata to use the custom domain.
