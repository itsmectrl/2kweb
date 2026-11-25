/* Copyright (c) 2026 itsmectrl. All Rights Reserved. */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { LOCALES } from './config.mjs';

const require = createRequire(import.meta.url);
const playwrightPath = process.env.PLAYWRIGHT_PATH || '/usr/local/share/bun-global/node_modules/playwright';
const { chromium } = require(playwrightPath);

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC_IMAGES_DIR = path.join(ROOT, 'src', 'assets', 'images');
const OUT_DIR = path.join(ROOT, 'src', 'assets', 'og');
const I18N_DIR = path.join(ROOT, 'src', 'i18n');

function findSourceImage(prefix) {
  if (!fs.existsSync(SRC_IMAGES_DIR)) return '';
  const files = fs.readdirSync(SRC_IMAGES_DIR).filter((f) => f.startsWith(`${prefix}_`)).sort();
  return files.length ? path.join(SRC_IMAGES_DIR, files[files.length - 1]) : '';
}

function stripPngMetadata(buffer) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (!buffer.subarray(0, 8).equals(sig)) {
    throw new Error('Invalid PNG header');
  }
  const chunks = [sig];
  let offset = 8;
  const keep = new Set(['IHDR', 'PLTE', 'IDAT', 'tRNS', 'gAMA', 'cHRM', 'sRGB', 'IEND']);
  while (offset + 8 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString('ascii');
    const total = 12 + length;
    if (offset + total > buffer.length) break;
    if (keep.has(type)) {
      chunks.push(buffer.subarray(offset, offset + total));
    }
    offset += total;
    if (type === 'IEND') break;
  }
  return Buffer.concat(chunks);
}

function cardHtml({ locale, dict, imgDataUri }) {
  const isRtl = dict.dir === 'rtl';
  const after = dict.hero.titleAfter || '';
  const headline = `${dict.hero.titleBefore}<em>${dict.hero.titleAccent}</em>${after}`;
  const tag = dict.hero.tag;
  const metaHtml = dict.hero.metaIdle.replace(
    /Android\s+7\.0\+|\bAndroid\b/g,
    (m) => `<bdi dir="ltr">${m}</bdi>`
  );
  const ogFontUrl =
    locale.key === 'zh'
      ? 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@700&family=Space+Mono:wght@400;700&family=UnifrakturCook:wght@700&display=swap'
      : locale.fontUrl;

  const artAlign =
    locale.key === 'ar'
      ? 'left: 16px; width: 520px; -webkit-mask-image: linear-gradient(to right, #000 78%, transparent 100%); mask-image: linear-gradient(to right, #000 78%, transparent 100%);'
      : locale.key === 'zh'
        ? 'right: 16px; width: 520px; -webkit-mask-image: linear-gradient(to left, #000 78%, transparent 100%); mask-image: linear-gradient(to left, #000 78%, transparent 100%);'
        : 'right: 10px; width: 620px; -webkit-mask-image: linear-gradient(to left, #000 80%, transparent 100%); mask-image: linear-gradient(to left, #000 80%, transparent 100%);';
  const copyAlign =
    locale.key === 'ar'
      ? 'margin-left: auto; text-align: right;'
      : 'text-align: left;';
  const copyPad =
    locale.key === 'ar'
      ? 'padding: 58px 64px 58px 540px;'
      : 'padding: 58px 540px 58px 64px;';

  return `<!DOCTYPE html>
<html lang="${dict.lang}" dir="${dict.dir}">
<head>
<meta charset="utf-8">
<link href="${ogFontUrl}" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1200px;
    height: 630px;
    overflow: hidden;
    background: #0b0b0b;
    color: #f4f4f2;
    font-family: ${
      locale.key === 'ar'
        ? '"IBM Plex Sans Arabic", "Noto Sans Arabic", sans-serif'
        : locale.key === 'zh'
          ? '"Space Mono", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif'
          : '"Space Mono", monospace'
    };
    position: relative;
  }
  .grid {
    position: absolute;
    inset: 0;
    background:
      repeating-linear-gradient(45deg, transparent 0 9px, rgba(255,255,255,.06) 9px 10px),
      repeating-linear-gradient(-45deg, transparent 0 9px, rgba(255,255,255,.06) 9px 10px);
  }
  .st-top, .st-bot {
    position: absolute;
    left: 0; right: 0;
    height: 18px;
    z-index: 4;
    background: radial-gradient(circle at 36% 34%, #fff 0 2px, #8c8c8c 2.8px 4.6px, transparent 5.2px) 0 0 / 22px 18px repeat-x;
  }
  .st-top { top: 0; border-bottom: 3px solid #f4f4f2; }
  .st-bot { bottom: 0; border-top: 3px solid #f4f4f2; }
  .art-wrap {
    position: absolute;
    top: 22px;
    bottom: 22px;
    ${artAlign}
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .art-wrap img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    filter: grayscale(100%) contrast(1.08);
    mix-blend-mode: lighten;
  }
  .content {
    position: relative;
    z-index: 3;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    ${copyPad}
    ${copyAlign}
  }
  .brand {
    font-family: "UnifrakturCook", Georgia, serif;
    font-size: 62px;
    font-weight: 700;
    line-height: 1;
    margin-bottom: 18px;
  }
  .tag {
    display: inline-block;
    align-self: ${isRtl ? 'flex-end' : 'flex-start'};
    border: 2px solid #f4f4f2;
    padding: 7px 14px;
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 22px;
    background: #0b0b0b;
  }
  h1 {
    font-family: ${
      locale.key === 'ar'
        ? '"Noto Kufi Arabic", sans-serif'
        : locale.key === 'zh'
          ? '"UnifrakturCook", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif'
          : '"UnifrakturCook", Georgia, serif'
    };
    font-size: ${locale.key === 'ar' ? '50px' : locale.key === 'zh' ? '54px' : '64px'};
    line-height: ${locale.key === 'ar' || locale.key === 'zh' ? '1.2' : '0.96'};
    margin-bottom: 22px;
  }
  h1 em {
    font-style: normal;
    display: inline-block;
    background: #f4f4f2;
    color: #0b0b0b;
    padding: 0 .14em;
    margin-inline-end: ${isRtl ? '8px' : '0'};
    box-shadow: ${isRtl ? '-6px' : '6px'} 6px 0 #8a8a86;
  }
  .meta {
    font-size: 20px;
    font-weight: 700;
    color: #cfcfcb;
  }
</style>
</head>
<body>
  <div class="grid"></div>
  <div class="st-top"></div>
  <div class="art-wrap"><img src="${imgDataUri}" alt=""></div>
  <div class="content">
    <div class="brand" dir="ltr">All2K</div>
    <span class="tag">${tag}</span>
    <h1>${headline}</h1>
    <div class="meta">${metaHtml}</div>
  </div>
  <div class="st-bot"></div>
</body>
</html>`;
}

async function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1200, height: 630 } });
    const page = await context.newPage();

    for (const locale of LOCALES) {
      const dict = JSON.parse(fs.readFileSync(path.join(I18N_DIR, locale.jsonFile), 'utf8'));
      const imgPath = findSourceImage(`og_${locale.key}`);
      if (!imgPath) {
        throw new Error(`Missing generated base artwork for og_${locale.key}`);
      }
      const b64 = fs.readFileSync(imgPath).toString('base64');
      const imgDataUri = `data:image/jpeg;base64,${b64}`;
      const html = cardHtml({ locale, dict, imgDataUri });
      await page.setContent(html, { waitUntil: 'networkidle' });
      const rawPng = await page.screenshot({ type: 'png' });
      const cleanPng = stripPngMetadata(rawPng);
      const outPath = path.join(OUT_DIR, locale.ogFile);
      fs.writeFileSync(outPath, cleanPng);
      console.log(`Generated ${locale.ogFile} (${cleanPng.length} bytes)`);
    }
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
