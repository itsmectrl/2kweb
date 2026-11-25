<!-- Copyright (c) 2026 itsmectrl. All Rights Reserved. -->
# Translation Notes

All user-facing copy lives in four JSON source files with matching keys and interpolation tokens:

- `src/i18n/en.json` — English (`lang="en"`, `dir="ltr"`)
- `src/i18n/fr.json` — French (`lang="fr"`, `dir="ltr"`)
- `src/i18n/ar.json` — Arabic (`lang="ar"`, `dir="rtl"`)
- `src/i18n/zh.json` — Simplified Chinese (`lang="zh-Hans"`, `dir="ltr"`)

## Core Glossary

| Concept | EN | FR | AR | ZH (`zh-Hans`) |
| --- | --- | --- | --- | --- |
| Product / Brand | All2K | All2K | All2K | All2K |
| Platform / Package | Android 7.0+ / APK | Android 7.0+ / APK | Android 7.0+ / APK | Android 7.0+ / APK |
| Creator | itsmectrl | itsmectrl | itsmectrl | itsmectrl |
| Primary CTA | Download APK | Télécharger l’APK | تنزيل APK | 下载 APK |
| Click Wheel | Click wheel | Molette cliquable | عجلة التحكم | 点按式转盘 |
| Signing / Safety | Signed by the developer | Signée par le développeur | موقّع رقمياً من المطور | 由开发者签名 |
| Updates | In-app updates | Mises à jour dans l’appli | تحديثات من داخل التطبيق | 应用内更新 |
| SHA-256 Check | Verify your download | Vérifier le téléchargement | التحقق من سلامة الملف | 校验文件哈希 |

Terms kept untranslated across every language: `All2K`, `Android`, `APK`, `iPod`, `itsmectrl`, `SHA-256`, release tag names (`vX.Y.Z`), hardware label `MENU`, and the decorative sticker (`ADVISORY / EXPLICIT FEELINGS`, marked `aria-hidden="true"`).

## Locale Formatting & Script Conventions

- **French (`fr`)**: Uses *tutoiement* throughout (`ton vieil iPod`, `Télécharge`, `Installe`), genuine non-breaking spaces before `: ; ! ?`, accented capitals, and `fr-FR` `Intl` date/size formatting (`Mo`/`Ko`).
- **Arabic (`ar`)**: Modern Standard Arabic (`ar-EG-u-nu-latn` for `Intl` date/size formatting so months use standard MSA names like `نوفمبر` alongside Western `0-9` digits), `<bdi dir="ltr">` wrapping around inline `All2K`, `Android 7.0+`, `APK`, `iPod`, `itsmectrl`, and SHA-256 strings, `Noto Kufi Arabic` + `IBM Plex Sans Arabic`, `line-height: 1.8`, and zero `letter-spacing` / `text-transform`.
- **Simplified Chinese (`zh-Hans`)**: Uses casual second-person `你`, full-width Chinese punctuation (`，。？！：；`), zero `letter-spacing` or italic styles, `line-height: 1.7`, and a zero-download system CJK font stack (`PingFang SC`, `Hiragino Sans GB`, `Microsoft YaHei`, `Noto Sans CJK SC`, `Source Han Sans SC`). Only lightweight Latin/pixel display faces are requested from Google Fonts for the `All2K` wordmark, numerals, and LCD status header.

## RTL / CJK Visual Deviations from Base Layout

- **Arabic (`dir="rtl"`)**:
  - `line-height` raised to `1.8` (`1.18` on display headlines) and `letter-spacing` / `text-transform: uppercase` removed across headings, badges, buttons, and FAQ titles.
  - Display headings combine `UnifrakturCook` (for Latin `All2K` and `2006`) with `Noto Kufi Arabic` (for Arabic script); body copy switches to `IBM Plex Sans Arabic`.
  - Inverted headline `em` rotation (`rotate: 2deg`), shadow offsets (`-7px 7px 0`), card shadow (`-8px 8px 0`), and `.pod` tilt (`rotate: 2deg`, `-12px 14px 0`) mirror horizontally, with `margin-inline-end: 8px` keeping the trailing period clear of the `2006` shadow box.
  - `.steps` mobile dashed guide switches to logical `border-inline-start`.
  - `.stk` sticker moves to the opposite edge (`right: -22px`, `rotate: 8deg`) so it stays outside the click wheel.
  - `.lcd` menu chevron flips from `›` to `‹` in RTL, while `.wheel` keeps `direction: ltr` so physical Previous (left) and Next (right) hardware buttons stay stationary.
  - `.lcd` and row text scale down to `15px`–`16px` (`line-height: 1.2`) in Arabic and Chinese so all 4 lines, header, and footer fit inside the fixed `204px` LCD screen without overflow.
- **Chinese (`zh-Hans`)**:
  - `line-height` raised to `1.7` (`1.18` on display headings), `letter-spacing` and `text-transform: uppercase` disabled on prose and headings, and hero `em` box padded slightly taller (`0.04em .14em`).

## Flagged for Native Speaker Review

All non-English copy was drafted without external native-speaker sign-off and should be reviewed by native speakers before public release, paying particular attention to:

1. **French**: Tone balance between casual Y2K phrasing (`Prends l’APK`, `On lance le son ?`) and clarity on installation prompts.
2. **Arabic**: Colloquial vs. MSA feel in short hero hook (`اضغط تشغيل وكأننا في 2006.`) and concise iPod LCD phrases (`تحديث بالتطبيق`, `شغّل موسيقاك`).
3. **Simplified Chinese**: Idiomatic rhythm of `按下播放，回到 2006。` and concise step titles (`下载 / 安装 / 播放`).
