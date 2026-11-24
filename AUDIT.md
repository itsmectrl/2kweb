# Clean-Up & Authorship Audit (`site/`)

**Scope:** All 29 files under `site/` listed alphabetically (`LC_ALL=C find site -type f | LC_ALL=C sort`).  
**Owner:** `itsmectrl`  
**Audit goal:** Consistent `itsmectrl` authorship headers and `<meta name="author">` tags, lowercase/why-only comments, zero metadata/environment leaks, zero AI tool/vendor references, and zero functional or visual changes.

---

## Per-File Checklist (29 / 29 Files)

| File | Findings | Changes |
|---|---|---|
| `site/404.html` | Missing copyright header comment and `<meta name="author">` tag; subpath home fallback updated to `/2kweb/`. | Added `<!-- Copyright (c) 2026 itsmectrl. All Rights Reserved. -->` after `<!DOCTYPE html>`, `<meta name="author" content="itsmectrl">`, and `/2kweb/` home fallback check. |
| `site/assets/desktop/desktop.css` | Missing copyright header comment; title-case section banner comments and one comment containing `cursor` (`/* Scroll progress & custom cursor */`). Legitimate CSS `cursor: pointer;` declarations retained. | Added `/* Copyright (c) 2026 itsmectrl. All Rights Reserved. */`; removed obvious section comments; rewrote grain note to lowercase `/* transform-only grain layer avoids layout repaints */`. |
| `site/assets/desktop/desktop.js` | Missing copyright header comment; 13 numbered narration comments (`/* 1. ... */` to `/* 13. ... */`) including `cursor` in `#6`. | Added `/* Copyright (c) 2026 itsmectrl. All Rights Reserved. */`; removed all 13 numbered section comments. |
| `site/assets/mobile/mobile.css` | Missing copyright header comment; title-case section banner comments and device example in landscape note. Legitimate CSS `cursor: pointer;` declaration retained. | Added `/* Copyright (c) 2026 itsmectrl. All Rights Reserved. */`; removed obvious section comments; rewrote `m-hero` and landscape comments to short lowercase why notes. |
| `site/assets/mobile/mobile.js` | Missing copyright header comment; 8 numbered narration comments (`/* 1. ... */` to `/* 8. ... */`). | Added `/* Copyright (c) 2026 itsmectrl. All Rights Reserved. */`; removed numbered narration comments; rewrote battery-saving note in lowercase (`/* pause off-screen animations to save battery */`). |
| `site/assets/shared/fonts/archivo-black-400-latin-ext.woff2` | Third-party OFL binary font (`Copyright 2017 The Archivo Black Project Authors`); `sfnt` decompressed table scan returned zero flagged terms. | Unchanged (third-party notice preserved). |
| `site/assets/shared/fonts/archivo-black-400-latin.woff2` | Third-party OFL binary font; `sfnt` decompressed table scan returned zero flagged terms. | Unchanged (third-party notice preserved). |
| `site/assets/shared/fonts/space-mono-400-latin-ext.woff2` | Third-party OFL binary font (`Copyright 2016 The Space Mono Project Authors`); `sfnt` decompressed table scan returned zero flagged terms. | Unchanged (third-party notice preserved). |
| `site/assets/shared/fonts/space-mono-400-latin.woff2` | Third-party OFL binary font (`Copyright 2016 The Space Mono Project Authors`); `sfnt` decompressed table scan returned zero flagged terms. | Unchanged (third-party notice preserved). |
| `site/assets/shared/fonts/space-mono-700-latin-ext.woff2` | Third-party OFL binary font (`Copyright 2016 The Space Mono Project Authors`); `sfnt` decompressed table scan returned zero flagged terms. | Unchanged (third-party notice preserved). |
| `site/assets/shared/fonts/space-mono-700-latin.woff2` | Third-party OFL binary font (`Copyright 2016 The Space Mono Project Authors`); `sfnt` decompressed table scan returned zero flagged terms. | Unchanged (third-party notice preserved). |
| `site/assets/shared/i18n.js` | Missing copyright header comment; capitalized DOM note in fallback catch block. | Added `/* Copyright (c) 2026 itsmectrl. All Rights Reserved. */`; lowercased catch comment (`/* keep inline dom copy when locale fetch fails */`). |
| `site/assets/shared/icons/deck.svg` | Missing copyright header comment; no `<metadata>` or authoring tool comments found. | Added `<!-- Copyright (c) 2026 itsmectrl. All Rights Reserved. -->`. |
| `site/assets/shared/icons/sparkle.svg` | Missing copyright header comment; no `<metadata>` or authoring tool comments found. | Added `<!-- Copyright (c) 2026 itsmectrl. All Rights Reserved. -->`. |
| `site/assets/shared/locales/ar.json` | No flagged terms, paths, or comments (JSON does not permit comments). | Unchanged. |
| `site/assets/shared/locales/en.json` | No flagged terms, paths, or comments (JSON does not permit comments). | Unchanged. |
| `site/assets/shared/locales/fr.json` | No flagged terms, paths, or comments (JSON does not permit comments). | Unchanged. |
| `site/assets/shared/platform.js` | Missing copyright header comment; capitalized explanatory comments. Legitimate `navigator.userAgent` and `navigator.userAgentData` API usage retained. | Added `/* Copyright (c) 2026 itsmectrl. All Rights Reserved. */`; removed obvious comments and lowercased why notes. |
| `site/assets/shared/qr.js` | Missing copyright header comment; intro JSDoc banner (`generator`, `Zero external dependencies`) and capitalized section comments (`Mode:`, `N1:`..`N4:`). Legitimate mathematical function name `rsGeneratorPoly` retained. | Added `/* Copyright (c) 2026 itsmectrl. All Rights Reserved. */`; replaced JSDoc banner with concise lowercase scope note; removed obvious step comments and lowercased remaining spec notes. |
| `site/assets/shared/release.js` | Missing copyright header comment. | Added `/* Copyright (c) 2026 itsmectrl. All Rights Reserved. */`. |
| `site/assets/shared/sound.js` | Missing copyright header comment. | Added `/* Copyright (c) 2026 itsmectrl. All Rights Reserved. */`. |
| `site/assets/shared/tokens.css` | Missing copyright header comment; capitalized section comments. Legitimate CSS `cursor:` declarations (`pointer`, `grab`, `grabbing`) retained. | Added `/* Copyright (c) 2026 itsmectrl. All Rights Reserved. */`; removed obvious banner comments and lowercased collapse why note. |
| `site/assets/shared/wheel.js` | Missing copyright header comment; inline section/obvious comments (`// Four cardinal buttons`, `// Center = Download`, etc.). | Added `/* Copyright (c) 2026 itsmectrl. All Rights Reserved. */`; removed redundant section comments and kept lowercase `touch-action` rationale comment. |
| `site/favicon.svg` | Missing copyright header comment; no `<metadata>` or authoring tool comments found. | Added `<!-- Copyright (c) 2026 itsmectrl. All Rights Reserved. -->`. |
| `site/index.html` | Missing copyright header comment and `<meta name="author">` tag; SEO/social metadata updated to `https://itsmectrl.github.io/2kweb/`. Inline routing script uses legitimate `navigator.userAgent` (CSP hash preserved untouched). Existing `Made by itsmectrl · © 2026 itsmectrl. All Rights Reserved.` footer verified. | Added `<!-- Copyright (c) 2026 itsmectrl. All Rights Reserved. -->`, `<meta name="author" content="itsmectrl">`, and `2kweb` canonical/alternate/og/twitter URLs while keeping all internal asset paths relative. |
| `site/m/index.html` | Missing copyright header comment and `<meta name="author">` tag; SEO/social metadata updated to `https://itsmectrl.github.io/2kweb/`. Existing `Made by itsmectrl · © 2026 itsmectrl. All Rights Reserved.` footer verified; CSP inline script hash preserved untouched. | Added `<!-- Copyright (c) 2026 itsmectrl. All Rights Reserved. -->`, `<meta name="author" content="itsmectrl">`, and `2kweb` canonical/og/twitter URLs while keeping all internal asset paths relative. |
| `site/og-image.png` | Chunk parse shows strictly `IHDR`, 20 × `IDAT`, `IEND` (zero `tEXt`, `zTXt`, `iTXt`, EXIF, XMP, or `Software` chunks). `identify -verbose` shows only standard PNG geometry/date attributes (`date:create`, `date:modify`). Raw compressed bitstream latin1 regex matched accidental byte sequence `LLM` inside zlib pixel data. | Unchanged. |
| `site/robots.txt` | Contains standard crawler directive `User-agent: *` and `https://itsmectrl.github.io/2kweb/sitemap.xml` URL. | Updated sitemap directive to `2kweb`. |
| `site/sitemap.xml` | Standard XML sitemap (`itsmectrl.github.io/2kweb/` URLs only); no tool metadata or flagged terms. | Updated `<loc>` URLs to `2kweb`. |

---

## Justified Retained Substring Matches

After edits, a case-insensitive regex across all 29 files matched only the following legitimate identifiers, CSS properties, protocol directives, and binary compressed bytes:

1. `site/assets/desktop/desktop.css` (`:363`, `:615`), `site/assets/mobile/mobile.css` (`:515`), `site/assets/shared/tokens.css` (`:145`, `:244`, `:247`, `:662`) — standard CSS `cursor: pointer`, `cursor: grab`, and `cursor: grabbing` declarations.
2. `site/index.html` (`:23`) & `site/assets/shared/platform.js` (`:10`, `:12`) — standard Web API properties `navigator.userAgent` and `navigator.userAgentData` for device/Android detection.
3. `site/assets/shared/qr.js` (`:25`, `:40`) — Reed-Solomon generator polynomial helper `rsGeneratorPoly`.
4. `site/robots.txt` (`:1`) — standard `User-agent: *` directive.
5. `site/og-image.png` — three-byte sequence `LLM` within compressed `IDAT` pixel data (confirmed zero ancillary text/metadata PNG chunks).
6. `site/assets/shared/fonts/*.woff2` — embedded Open Font License copyright strings for Archivo Black and Space Mono left intact as third-party notices.

---

## Binary Inspection & Limitations

- `exiftool` is not installed in this environment; PNG metadata was inspected instead using ImageMagick (`identify -verbose`), a Python PNG chunk parser listing every chunk type and byte length (`IHDR`, `IDAT`, `IEND`), and raw `strings`/latin1 scans.
- WOFF2 font binaries were decompressed via Node `zlib.brotliDecompressSync` to inspect internal `sfnt` strings directly rather than relying only on raw `strings` output.
