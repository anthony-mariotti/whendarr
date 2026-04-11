export const LANG_NAMES = {
  en: 'English'
} as const;

export type LangCode = keyof typeof LANG_NAMES;

export function getSupportedLang(): string[] {
  return Object.keys(LANG_NAMES);
}

export function isLangSupported(lang: string): boolean {
  if (!lang || typeof lang !== 'string') return false;
  return lang in LANG_NAMES;
}

export function resolveLang(lang: string): string | null {
  if (!lang || typeof lang !== 'string') return null;

  const normalized = normalizeLangCode(lang);

  if (normalized in LANG_NAMES) {
    return normalized;
  }

  const base = normalized.split('-')[0];
  if (!base) return null;

  if (base === 'en') {
    return 'en';
  }

  const match = Object.keys(LANG_NAMES).find((code) => code.startsWith(base + '-'));
  return match ?? null;
}

function normalizeLangCode(code: string): string {
  const trimmed = code.trim();
  const [lang, region] = trimmed.split('-');
  if (!region) return trimmed.toLowerCase();
  return `${lang?.toLowerCase()}-${region.toUpperCase()}`;
}

export async function detectLang(): Promise<string> {
  const detected = getSystemLang();
  if (detected) return detected;

  return 'en';
}

export function getSystemLang(): string | null {
  if (typeof navigator === 'undefined') return null;

  const detected = navigator.languages || (navigator.language ? [navigator.language] : []);

  for (const lang of detected) {
    if (!lang) continue;
    const found = resolveLang(lang);
    if (found) return found;
  }

  return null;
}
