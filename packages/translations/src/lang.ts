export const LANG_NAMES = {
  en: 'English',
  'de-DE': 'Deutsch'
} as const;

export type LangCode = keyof typeof LANG_NAMES;

export function getSupportedLang(): string[] {
  return Object.keys(LANG_NAMES);
}

export function isLangSupported(lang: string): boolean {
  if (!lang || typeof lang !== 'string') return false;
  return lang in LANG_NAMES;
}

export async function detectLang(storage?: {
  getItem: (key: string) => Promise<string | null>;
}): Promise<string> {
  try {
    // TODO: Check stored preferences
  } catch (error) {
    console.warn('[i18n] Failed to get stored language', error);
  }

  // TODO: Check browser/device language

  return 'en';
}
