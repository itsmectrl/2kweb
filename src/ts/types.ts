/* Copyright (c) 2026 itsmectrl. All Rights Reserved. */

export type SupportedLang = 'en' | 'fr' | 'ar' | 'zh-Hans';

export interface LangTarget {
  code: SupportedLang;
  label: string;
  href: string;
}

export interface PodShortStrings {
  headerRoot: string;
  footerIdle: string;
  footerTag: string;
  menu: string[];
  paneTitles: string[];
  panes: string[][];
}

export interface ClientStrings {
  lang: SupportedLang;
  dir: 'ltr' | 'rtl';
  localeCode: string;
  hero: {
    metaIdle: string;
    metaTagOnly: string;
    metaLoaded: string;
    copied: string;
  };
  banner: {
    prompt: string;
    cta: string;
    dismiss: string;
  };
  pod: {
    soundOff: string;
    soundOn: string;
    short: PodShortStrings;
  };
  languages: LangTarget[];
}

export interface ReleaseInfo {
  tag: string;
  url: string;
  digest: string;
  size: number;
  publishedAt: string;
}
