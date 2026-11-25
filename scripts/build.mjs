/* Copyright (c) 2026 itsmectrl. All Rights Reserved. */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { BASE_URL, LOCALES } from './config.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'src');
const SITE = path.join(ROOT, 'site');

function escHtml(raw) {
  return String(raw)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wrapBdi(text) {
  return String(text).replace(
    /Android\s+7\.0\+|\b(All2K|Android|APK|iPod|SHA-256|itsmectrl)\b/g,
    (m) => `<bdi dir="ltr">${m}</bdi>`
  );
}

function formatRichProse(raw, lang) {
  const escaped = escHtml(raw);
  return lang === 'ar' || lang === 'zh-Hans' ? wrapBdi(escaped) : escaped;
}

function renderInstallStepBody(body, lang) {
  const parts = String(body).split('{apk}');
  if (parts.length === 1) return formatRichProse(body, lang);
  const before = formatRichProse(parts[0], lang);
  const after = formatRichProse(parts.slice(1).join('{apk}'), lang);
  return `${before}<bdi dir="ltr"><code>.apk</code></bdi>${after}`;
}

function langHref(fromLocale, targetLocale) {
  if (!fromLocale.relPath) {
    return targetLocale.relPath || './';
  }
  return `../${targetLocale.relPath}`;
}

function renderLangSwitcher(fromLocale, navLabel) {
  const links = LOCALES.map((target) => {
    const href = langHref(fromLocale, target);
    const current = target.key === fromLocale.key ? ' aria-current="page"' : '';
    return `<a href="${href}" hreflang="${target.hreflang}" lang="${target.lang}" data-lang-switch="${target.lang}"${current}>${escHtml(target.shortLabel)}</a>`;
  }).join('');
  return `<nav class="lang-nav" aria-label="${escHtml(navLabel)}">${links}</nav>`;
}

function renderFooterLangSwitcher(fromLocale, navLabel) {
  const links = LOCALES.map((target) => {
    const href = langHref(fromLocale, target);
    const current = target.key === fromLocale.key ? ' aria-current="page"' : '';
    return `<a href="${href}" hreflang="${target.hreflang}" lang="${target.lang}" data-lang-switch="${target.lang}"${current}>${escHtml(target.nativeLabel)}</a>`;
  }).join('');
  return `<nav class="lang-nav" aria-label="${escHtml(navLabel)}">${links}</nav>`;
}

function renderHreflangLinks() {
  const tags = LOCALES.map(
    (loc) => `<link rel="alternate" hreflang="${loc.hreflang}" href="${BASE_URL}${loc.relPath}">`
  );
  tags.push(`<link rel="alternate" hreflang="x-default" href="${BASE_URL}">`);
  return tags.join('\n');
}

function renderOgLocaleAlternates(currentOgLocale, dictsByKey) {
  return LOCALES.filter((loc) => dictsByKey[loc.key].ogLocale !== currentOgLocale)
    .map((loc) => `<meta property="og:locale:alternate" content="${dictsByKey[loc.key].ogLocale}">`)
    .join('\n');
}

function renderFontLinks(fontUrl) {
  return [
    '<link rel="preconnect" href="https://fonts.googleapis.com">',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    `<link href="${escHtml(fontUrl)}" rel="stylesheet">`
  ].join('\n');
}

function applyTemplate(template, vars) {
  return template.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (match, key) => {
    if (!Object.prototype.hasOwnProperty.call(vars, key)) {
      throw new Error(`Missing template variable: ${key}`);
    }
    return vars[key];
  });
}

function runTsc() {
  const tscBin = path.join(ROOT, 'node_modules', '.bin', 'tsc');
  execFileSync(tscBin, ['-p', path.join(ROOT, 'tsconfig.client.json')], {
    cwd: ROOT,
    stdio: 'inherit'
  });
  const jsDir = path.join(SITE, 'assets', 'js');
  const header = '/* Copyright (c) 2026 itsmectrl. All Rights Reserved. */\n';
  for (const file of fs.readdirSync(jsDir)) {
    if (!file.endsWith('.js')) continue;
    const full = path.join(jsDir, file);
    const body = fs.readFileSync(full, 'utf8');
    if (!body.includes('Copyright (c) 2026 itsmectrl. All Rights Reserved.')) {
      fs.writeFileSync(full, header + body, 'utf8');
    }
  }
}

function copyStaticAssets() {
  fs.mkdirSync(path.join(SITE, 'assets', 'css'), { recursive: true });
  fs.mkdirSync(path.join(SITE, 'assets', 'img'), { recursive: true });
  fs.copyFileSync(
    path.join(SRC, 'styles', 'main.css'),
    path.join(SITE, 'assets', 'css', 'style.css')
  );
  fs.copyFileSync(
    path.join(SRC, 'favicon.svg'),
    path.join(SITE, 'assets', 'img', 'favicon.svg')
  );

  const ogSrcDir = path.join(SRC, 'assets', 'og');
  for (const loc of LOCALES) {
    const srcOg = path.join(ogSrcDir, loc.ogFile);
    if (!fs.existsSync(srcOg)) {
      throw new Error(`Missing generated OG image: ${srcOg}. Run build-og first.`);
    }
    fs.copyFileSync(srcOg, path.join(SITE, 'assets', 'img', loc.ogFile));
  }
}

function buildSitemap() {
  const urlEntries = LOCALES.map((loc) => {
    const selfHref = `${BASE_URL}${loc.relPath}`;
    const alternates = LOCALES.map(
      (alt) => `    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${BASE_URL}${alt.relPath}"/>`
    );
    alternates.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}"/>`);
    return `  <url>\n    <loc>${selfHref}</loc>\n${alternates.join('\n')}\n  </url>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Copyright (c) 2026 itsmectrl. All Rights Reserved. -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlEntries}
</urlset>
`;
  fs.writeFileSync(path.join(SITE, 'sitemap.xml'), xml, 'utf8');

  const robots = `User-agent: *
Allow: /

Sitemap: ${BASE_URL}sitemap.xml
`;
  fs.writeFileSync(path.join(SITE, 'robots.txt'), robots, 'utf8');
}

function build() {
  fs.rmSync(SITE, { recursive: true, force: true });
  fs.mkdirSync(SITE, { recursive: true });

  runTsc();
  copyStaticAssets();

  const template = fs.readFileSync(path.join(SRC, 'template.html'), 'utf8');
  const template404 = fs.readFileSync(path.join(SRC, '404.template.html'), 'utf8');

  const dictsByKey = {};
  for (const loc of LOCALES) {
    dictsByKey[loc.key] = JSON.parse(
      fs.readFileSync(path.join(SRC, 'i18n', loc.jsonFile), 'utf8')
    );
  }

  for (const loc of LOCALES) {
    const d = dictsByKey[loc.key];
    const assetPrefix = loc.relPath ? '../' : '';
    const homeHref = loc.relPath ? '../' : './';
    const canonicalUrl = `${BASE_URL}${loc.relPath}`;
    const ogImageUrl = `${BASE_URL}assets/img/${loc.ogFile}`;
    const arrowChar = d.dir === 'rtl' ? '‹' : '›';

    const lcdInitialRows = d.pod.short.menu
      .map((label, idx) => {
        const cur = idx === 0 ? ' aria-current="true"' : '';
        const chev = idx > 0 ? `<span class="chev" aria-hidden="true">${arrowChar}</span>` : '';
        return `<button class="it" type="button" data-i="${idx}"${cur}><span>${escHtml(label)}</span>${chev}</button>`;
      })
      .join('');

    const whyCards = d.why.cards
      .map((card, idx) => {
        const delay = idx > 0 ? ` style="transition-delay:.${idx}s"` : '';
        return `<div class="card rv"${delay}><i>${escHtml(card.num)}</i><h3>${formatRichProse(card.title, d.lang)}</h3><p>${formatRichProse(card.body, d.lang)}</p></div>`;
      })
      .join('\n        ');

    const installSteps = d.install.steps
      .map((step, idx) => {
        const delay = idx > 0 ? ` style="transition-delay:.${idx}s"` : '';
        return `<div class="step rv"${delay}><h3>${formatRichProse(step.title, d.lang)}</h3><p>${renderInstallStepBody(step.body, d.lang)}</p></div>`;
      })
      .join('\n        ');

    const faqItems = d.faq.items
      .map(
        (item) =>
          `<details><summary>${formatRichProse(item.q, d.lang)}</summary><p>${formatRichProse(item.a, d.lang)}</p></details>`
      )
      .join('\n        ');

    const clientStrings = {
      lang: d.lang,
      dir: d.dir,
      localeCode: d.localeCode,
      hero: {
        metaIdle: d.hero.metaIdle,
        metaTagOnly: d.hero.metaTagOnly,
        metaLoaded: d.hero.metaLoaded,
        copied: d.hero.copied
      },
      banner: {
        prompt: d.banner.prompt,
        cta: d.banner.cta,
        dismiss: d.banner.dismiss
      },
      pod: {
        soundOff: d.pod.soundOff,
        soundOn: d.pod.soundOn,
        short: d.pod.short
      },
      languages: LOCALES.map((target) => ({
        code: target.lang,
        label: target.nativeLabel,
        href: langHref(loc, target)
      }))
    };

    const jsonLd = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'All2K',
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Android 7.0+',
      inLanguage: d.lang,
      url: canonicalUrl,
      downloadUrl: 'https://github.com/itsmectrl/All2K-new/releases/latest',
      description: d.meta.description,
      author: {
        '@type': 'Person',
        name: 'itsmectrl'
      },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      }
    }).replace(/</g, '\\u003c');

    const html = applyTemplate(template, {
      lang: d.lang,
      dir: d.dir,
      metaTitle: escHtml(d.meta.title),
      metaDescription: escHtml(d.meta.description),
      assetPrefix,
      homeHref,
      canonicalUrl,
      hreflangLinks: renderHreflangLinks(),
      ogImageUrl,
      ogAlt: escHtml(d.meta.ogAlt),
      ogLocale: escHtml(d.ogLocale),
      ogLocaleAlternates: renderOgLocaleAlternates(d.ogLocale, dictsByKey),
      fontLinks: renderFontLinks(loc.fontUrl),
      jsonLd,
      skipLabel: escHtml(d.nav.skip),
      brand: escHtml(d.nav.brand),
      langNavLabel: escHtml(d.nav.langLabel),
      headerLangSwitcher: renderLangSwitcher(loc, d.nav.langLabel),
      footerLangSwitcher: renderFooterLangSwitcher(loc, d.nav.langLabel),
      navDownload: escHtml(d.nav.download),
      bannerDismiss: escHtml(d.banner.dismiss),
      heroTag: formatRichProse(d.hero.tag, d.lang),
      heroTitleBefore: formatRichProse(d.hero.titleBefore, d.lang),
      heroTitleAccent: escHtml(d.hero.titleAccent),
      heroTitleAfter: escHtml(d.hero.titleAfter || ''),
      heroLead: formatRichProse(d.hero.lead, d.lang),
      heroCta: formatRichProse(d.hero.cta, d.lang),
      heroMetaIdle: formatRichProse(d.hero.metaIdle, d.lang),
      heroNotAndroid: formatRichProse(d.hero.notAndroid, d.lang),
      heroCopyLink: escHtml(d.hero.copyLink),
      podHeaderRoot: escHtml(d.pod.short.headerRoot),
      podFooterIdle: escHtml(d.pod.short.footerIdle),
      podWheelLabel: escHtml(d.pod.wheelLabel),
      podMenuBtn: escHtml(d.pod.menuBtn),
      podPrevLabel: escHtml(d.pod.prevLabel),
      podNextLabel: escHtml(d.pod.nextLabel),
      podPlayLabel: escHtml(d.pod.playLabel),
      podSelectLabel: escHtml(d.pod.selectLabel),
      podSoundOff: escHtml(d.pod.soundOff),
      lcdInitialRows,
      whyTitleBefore: formatRichProse(d.why.titleBefore, d.lang),
      whyTitleAccent: formatRichProse(d.why.titleAccent, d.lang),
      whyCards,
      installTitleBefore: formatRichProse(d.install.titleBefore, d.lang),
      installTitleAccent: formatRichProse(d.install.titleAccent, d.lang),
      installSteps,
      faqTitleBefore: formatRichProse(d.faq.titleBefore, d.lang),
      faqTitleAccent: formatRichProse(d.faq.titleAccent, d.lang),
      faqItems,
      verifySummary: escHtml(d.faq.verify.summary),
      verifyLabel: escHtml(d.faq.verify.label),
      verifyCopyHash: escHtml(d.faq.verify.copyHash),
      endTitleBefore: formatRichProse(d.end.titleBefore, d.lang),
      endTitleAccent: formatRichProse(d.end.titleAccent, d.lang),
      endCta: formatRichProse(d.end.cta, d.lang),
      footerPrefix: escHtml(d.footer.prefix),
      footerSuffix: escHtml(d.footer.suffix),
      dockCta: formatRichProse(d.dock.cta, d.lang),
      clientStringsJson: JSON.stringify(clientStrings).replace(/</g, '\\u003c')
    });

    const outPath = path.join(SITE, loc.outFile);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, html, 'utf8');
  }

  const defaultLoc = LOCALES[0];
  const defaultDict = dictsByKey[defaultLoc.key];
  const html404 = applyTemplate(template404, {
    lang: defaultDict.lang,
    dir: defaultDict.dir,
    assetPrefix: '',
    homeHref: './',
    notFoundTitle: escHtml(defaultDict.notFound.title),
    notFoundHeading: escHtml(defaultDict.notFound.heading),
    notFoundBody: escHtml(defaultDict.notFound.body),
    notFoundCta: escHtml(defaultDict.notFound.cta),
    fontLinks: renderFontLinks(defaultLoc.fontUrl),
    headerLangSwitcher: renderLangSwitcher(defaultLoc, defaultDict.nav.langLabel),
    footerLangSwitcher: renderFooterLangSwitcher(defaultLoc, defaultDict.nav.langLabel),
    navDownload: escHtml(defaultDict.nav.download),
    footerPrefix: escHtml(defaultDict.footer.prefix),
    footerSuffix: escHtml(defaultDict.footer.suffix)
  });
  fs.writeFileSync(path.join(SITE, '404.html'), html404, 'utf8');

  buildSitemap();
  console.log(`Built multilingual site to ${SITE}`);
}

build();
