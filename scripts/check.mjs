/* Copyright (c) 2026 itsmectrl. All Rights Reserved. */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { createRequire } from 'node:module';
import { BASE_URL, LOCALES } from './config.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const SITE = path.join(ROOT, 'site');
const I18N = path.join(ROOT, 'src', 'i18n');

const failures = [];
function fail(msg) {
  failures.push(msg);
}

function collectKeys(obj, prefix = '') {
  const keys = [];
  if (Array.isArray(obj)) {
    keys.push(`${prefix}[len:${obj.length}]`);
    obj.forEach((item, idx) => {
      keys.push(...collectKeys(item, `${prefix}[${idx}]`));
    });
    return keys;
  }
  if (obj && typeof obj === 'object') {
    for (const k of Object.keys(obj).sort()) {
      const next = prefix ? `${prefix}.${k}` : k;
      keys.push(...collectKeys(obj[k], next));
    }
    return keys;
  }
  keys.push(prefix);
  return keys;
}

function extractPlaceholders(obj, prefix = '', out = {}) {
  if (Array.isArray(obj)) {
    obj.forEach((item, idx) => extractPlaceholders(item, `${prefix}[${idx}]`, out));
    return out;
  }
  if (obj && typeof obj === 'object') {
    for (const k of Object.keys(obj)) {
      extractPlaceholders(obj[k], prefix ? `${prefix}.${k}` : k, out);
    }
    return out;
  }
  if (typeof obj === 'string') {
    if (!obj.trim() && prefix !== 'hero.titleAfter') {
      fail(`Empty string for key "${prefix}"`);
    }
    const matches = [...obj.matchAll(/\{([a-zA-Z0-9_]+)\}/g)].map((m) => m[1]).sort();
    out[prefix] = matches.join(',');
  }
  return out;
}

function checkI18nParity() {
  const dicts = {};
  for (const loc of LOCALES) {
    const file = path.join(I18N, loc.jsonFile);
    dicts[loc.key] = JSON.parse(fs.readFileSync(file, 'utf8'));
  }

  const baseKeys = collectKeys(dicts.en).join('\n');
  const basePlaceholders = extractPlaceholders(dicts.en);

  for (const loc of LOCALES) {
    const d = dicts[loc.key];
    const keys = collectKeys(d).join('\n');
    if (keys !== baseKeys) {
      fail(`i18n key mismatch in ${loc.jsonFile}`);
    }
    const ph = extractPlaceholders(d);
    for (const k of Object.keys(basePlaceholders)) {
      if (ph[k] !== basePlaceholders[k]) {
        fail(`Placeholder mismatch in ${loc.jsonFile} at ${k}: expected "${basePlaceholders[k]}", got "${ph[k]}"`);
      }
    }

    const short = d.pod.short;
    const allShortLines = [
      short.headerRoot,
      short.footerIdle,
      short.footerTag.replace('{tag}', 'v1.0.0'),
      ...short.menu,
      ...short.paneTitles,
      ...short.panes.flat()
    ];
    for (const line of allShortLines) {
      if (line.length > 18) {
        fail(`LCD string exceeds 18 chars in ${loc.jsonFile}: "${line}" (${line.length})`);
      }
    }
  }
  return dicts;
}

function stripTagsAndScripts(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<nav class="lang-nav"[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function checkSiteFiles(dicts) {
  const bannedPatterns = [
    /originostudio/i,
    /All2K-1/,
    /\b(Claude|Anthropic|Gemini|Bard|ChatGPT|OpenAI|Copilot|Windsurf|Aider)\b/i,
    /\bCursor\b|\.cursor\//,
    /sourceMappingURL/i
  ];

  const allowEnglishWords = new Set([
    'All2K', 'Android', 'ANDROID', 'APK', 'iPod', 'itsmectrl', 'SHA', '256', 'MENU',
    'ADVISORY', 'EXPLICIT', 'FEELINGS', 'EN', 'FR', '2006', '404', 'ALL2K',
    'Free', 'Reserved', 'Rights'
  ]);

  const cssPath = path.join(SITE, 'assets', 'css', 'style.css');
  const cssSize = zlib.gzipSync(fs.readFileSync(cssPath)).length;

  const jsDir = path.join(SITE, 'assets', 'js');
  const jsFiles = fs.readdirSync(jsDir).filter((f) => f.endsWith('.js'));
  const jsGzipBytes = jsFiles.reduce(
    (sum, f) => sum + zlib.gzipSync(fs.readFileSync(path.join(jsDir, f))).length,
    0
  );

  for (const loc of LOCALES) {
    const d = dicts[loc.key];
    const htmlPath = path.join(SITE, loc.outFile);
    if (!fs.existsSync(htmlPath)) {
      fail(`Missing built HTML: ${loc.outFile}`);
      continue;
    }
    const html = fs.readFileSync(htmlPath, 'utf8');

    const htmlOpen = html.match(/<html\b([^>]*)>/i)?.[1] || '';
    if (!htmlOpen.includes(`lang="${d.lang}"`) || !htmlOpen.includes(`dir="${d.dir}"`)) {
      fail(`Incorrect <html> lang/dir in ${loc.outFile}: ${htmlOpen}`);
    }
    if (!html.includes('<meta name="author" content="itsmectrl">')) {
      fail(`Missing author meta in ${loc.outFile}`);
    }
    if (!html.includes('Copyright (c) 2026 itsmectrl. All Rights Reserved.')) {
      fail(`Missing copyright header in ${loc.outFile}`);
    }

    for (const alt of LOCALES) {
      const expected = `<link rel="alternate" hreflang="${alt.hreflang}" href="${BASE_URL}${alt.relPath}">`;
      if (!html.includes(expected)) {
        fail(`Missing hreflang ${alt.hreflang} in ${loc.outFile}`);
      }
    }
    if (!html.includes(`<link rel="alternate" hreflang="x-default" href="${BASE_URL}">`)) {
      fail(`Missing x-default hreflang in ${loc.outFile}`);
    }

    const absAttrs = [...html.matchAll(/(?:href|src)=["']\/[^"']*["']/g)];
    if (absAttrs.length > 0) {
      fail(`Root-absolute URLs in ${loc.outFile}: ${absAttrs.map((m) => m[0]).join(', ')}`);
    }

    const inlineEvents = [...html.matchAll(/\son[a-z]+\s*=/gi)];
    if (inlineEvents.length > 0) {
      fail(`Inline event handler found in ${loc.outFile}`);
    }

    for (const pat of bannedPatterns) {
      if (pat.test(html)) {
        fail(`Banned pattern ${pat} found in ${loc.outFile}`);
      }
    }

    const htmlGzipBytes = zlib.gzipSync(Buffer.from(html, 'utf8')).length;
    const totalGzip = htmlGzipBytes + cssSize + jsGzipBytes;
    if (totalGzip > 80 * 1024) {
      fail(`Gzip budget exceeded on ${loc.outFile}: ${totalGzip} bytes (> 81920)`);
    } else {
      console.log(`Budget ${loc.outFile}: ${(totalGzip / 1024).toFixed(1)} KB gzip (HTML+CSS+JS)`);
    }

    if (loc.key === 'ar' || loc.key === 'zh') {
      const visible = stripTagsAndScripts(html);
      const latinRuns = visible.match(/[A-Za-z]{4,}/g) || [];
      for (const word of latinRuns) {
        if (!allowEnglishWords.has(word)) {
          fail(`Possible untranslated Latin word "${word}" in ${loc.outFile}`);
        }
      }
    }
  }

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (entry.name.endsWith('.map')) {
        fail(`Source map forbidden in site/: ${path.relative(ROOT, full)}`);
      }
      if (/\.(html|css|js|svg|xml)$/.test(entry.name)) {
        const text = fs.readFileSync(full, 'utf8');
        if (!text.includes('Copyright (c) 2026 itsmectrl. All Rights Reserved.')) {
          fail(`Missing copyright header in ${path.relative(ROOT, full)}`);
        }
        for (const pat of bannedPatterns) {
          if (pat.test(text)) {
            fail(`Banned pattern ${pat} in ${path.relative(ROOT, full)}`);
          }
        }
      }
      if (entry.name.endsWith('.png')) {
        const buf = fs.readFileSync(full);
        let offset = 8;
        while (offset + 8 <= buf.length) {
          const len = buf.readUInt32BE(offset);
          const type = buf.subarray(offset + 4, offset + 8).toString('ascii');
          if (['tEXt', 'zTXt', 'iTXt', 'eXIf'].includes(type)) {
            fail(`PNG metadata chunk ${type} present in ${path.relative(ROOT, full)}`);
          }
          offset += 12 + len;
          if (type === 'IEND') break;
        }
      }
    }
  }
  walk(SITE);
}

async function checkLayoutWithPlaywright() {
  let chromium;
  try {
    const require = createRequire(import.meta.url);
    ({ chromium } = require(
      process.env.PLAYWRIGHT_PATH || '/usr/local/share/bun-global/node_modules/playwright'
    ));
  } catch {
    console.log('Playwright not available in check script; skipping layout probe.');
    return;
  }

  const http = await import('node:http');
  const mime = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png'
  };

  const server = http.createServer((req, res) => {
    const reqPath = (req.url || '/').split('?')[0];
    const clean = reqPath.startsWith('/2kweb/')
      ? reqPath.slice('/2kweb'.length)
      : reqPath;
    let filePath = path.join(SITE, clean === '/' ? 'index.html' : clean);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}/2kweb/`;

  const browser = await chromium.launch({ headless: true });
  try {
    const viewports = [
      { width: 320, height: 568 },
      { width: 390, height: 844 },
      { width: 1440, height: 900 }
    ];
    for (const loc of LOCALES) {
      for (const vp of viewports) {
        const context = await browser.newContext({ viewport: vp, locale: loc.lang });
        const page = await context.newPage();
        await page.route('https://api.github.com/**', (route) => route.abort());
        await page.goto(`${baseUrl}${loc.relPath}`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(150);
        const metrics = await page.evaluate(() => {
          const docOverflow =
            document.documentElement.scrollWidth > window.innerWidth + 1;
          const lcd = document.getElementById('lcd');
          const lcdOverflow = lcd
            ? lcd.scrollHeight > lcd.clientHeight + 2 ||
              lcd.scrollWidth > lcd.clientWidth + 2
            : false;
          const header = document.querySelector('header');
          const headerRect = header ? header.getBoundingClientRect() : null;
          const headerWrapOverflow = header
            ? header.scrollWidth > window.innerWidth + 1
            : false;
          return {
            docOverflow,
            lcdOverflow,
            headerHeight: headerRect ? headerRect.height : 0,
            headerWrapOverflow
          };
        });
        if (metrics.docOverflow) {
          fail(`Horizontal overflow on ${loc.relPath || '/'} at ${vp.width}x${vp.height}`);
        }
        if (metrics.headerWrapOverflow) {
          fail(`Header overflow on ${loc.relPath || '/'} at ${vp.width}x${vp.height}`);
        }
        if (metrics.lcdOverflow) {
          fail(`LCD overflow on ${loc.relPath || '/'} at ${vp.width}x${vp.height}`);
        }
        await context.close();
      }
    }
  } finally {
    await browser.close();
    server.close();
  }
}

const dicts = checkI18nParity();
checkSiteFiles(dicts);
await checkLayoutWithPlaywright();

if (failures.length > 0) {
  console.error('CHECK FAILED:');
  failures.forEach((f) => console.error(` - ${f}`));
  process.exit(1);
}
console.log('All localization, asset budget, authorship, and layout checks passed.');
