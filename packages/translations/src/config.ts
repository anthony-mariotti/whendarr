/// <reference types="vite/client" />
/// <reference types="node" />

import i18n, { type InitOptions } from 'i18next';
import { initReactI18next } from 'react-i18next';

import commonEnUS from './locales/en-US/common.json' with { type: 'json' };
import mediaEnUS from './locales/en-US/media.json' with { type: 'json' };
import settingsEnUS from './locales/en-US/settings.json' with { type: 'json' };

import { DEFAULT_LOCALE, getSupportedLang, type LangCode } from './lang.js';

export const defaultNS = 'common';
export const namespaces = ['common', 'media', 'settings'] as const;

export type Namespace = (typeof namespaces)[number];

export const resources = {
  'en-US': {
    common: commonEnUS,
    media: mediaEnUS,
    settings: settingsEnUS
  }
} as const;

export type SupportedLang = LangCode;

type LocaleData = Record<string, Record<string, unknown>>;
type LocaleLoader = () => Promise<LocaleData>;

const localeModules = import.meta.glob<{ default: Record<string, unknown> }>([
  './locales/*/*.json',
  '!./locales/en-US/*.json'
]);

const localeLoaders: Record<string, LocaleLoader> = Object.fromEntries(
  getSupportedLang()
    .filter((l) => l !== DEFAULT_LOCALE)
    .map((locale) => [
      locale,
      async () => {
        const bundles: Record<string, Record<string, unknown>> = {};

        await Promise.all(
          namespaces.map(async (ns) => {
            const path = `./locales/${locale}/${ns}.json`;
            const loader = localeModules[path];

            if (loader) {
              const mod = await loader();
              bundles[ns] = mod.default;
            }
          })
        );

        return bundles;
      }
    ])
);

const loadedLocales = new Set<string>([DEFAULT_LOCALE]);

export async function loadLocale(lang: string): Promise<void> {
  if (loadedLocales.has(lang)) return;

  const loader = localeLoaders[lang];
  if (!loader) return;
  try {
    const bundles = await loader();
    for (const [ns, data] of Object.entries(bundles)) {
      i18n.addResourceBundle(lang, ns, data, true, true);
    }
    loadedLocales.add(lang);
  } catch (err) {
    console.error(`[i18n] Failed to load locale "${lang}", falling back to ${DEFAULT_LOCALE}`, err);
  }
}

export const defaultI18nConfig = {
  lng: DEFAULT_LOCALE,
  fallbackLng: DEFAULT_LOCALE,
  supportedLngs: getSupportedLang(),
  defaultNS,
  ns: namespaces,
  resources,
  interpolation: {
    escapeValue: false
  },
  returnNull: false,
  returnEmptyString: false
} satisfies InitOptions;

let initPromise: Promise<typeof i18n> | null = null;

export interface InitI18nOptions {
  lng?: SupportedLang;
}

export async function initI18n(options?: InitI18nOptions): Promise<typeof i18n> {
  if (i18n.isInitialized) {
    const targetLang = options?.lng || DEFAULT_LOCALE;
    if (targetLang !== DEFAULT_LOCALE) {
      await loadLocale(targetLang);
    }
    return i18n;
  }

  if (initPromise) {
    return initPromise;
  }

  const targetLang = options?.lng || DEFAULT_LOCALE;

  initPromise = i18n
    .use(initReactI18next)
    .init({
      ...defaultI18nConfig,
      ...options
    })
    .then(async () => {
      if (targetLang !== DEFAULT_LOCALE) {
        await loadLocale(targetLang);
      }
      initPromise = null;
      return i18n;
    })
    .catch((error: unknown) => {
      initPromise = null;
      throw error;
    });

  return initPromise;
}

export { i18n };
