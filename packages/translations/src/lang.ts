export const DEFAULT_LOCALE = 'en-US';
/**
 * Maps supported locale codes to their display names.
 *
 * Key format follows Crowdin's %locale% placeholder:
 *   - Source language English uses code 'en-US' (matching the locales/en-US/ directory).
 *   - All other languages use the full locale code: 'fr-FR', 'de-DE', 'zh-CN', 'pt-BR', etc.
 *
 * The locale code is also the directory name Crowdin writes translated files into,
 * so each key here must exactly match the corresponding locales/<key>/ directory.
 */
export const LANG_NAMES = {
  'en-US': 'English (United States)',
  'es-ES': 'Español'
  // 'fr-FR': 'Français',
  // 'de-DE': 'Deutsch',
  // 'pt-BR': 'Português (Brasil)',
  // 'zh-CN': '简体中文',
} as const;

export type LangCode = keyof typeof LANG_NAMES;

export function getSupportedLang(): LangCode[] {
  return Object.keys(LANG_NAMES) as LangCode[];
}

export function isLangSupported(lang: string): boolean {
  if (!lang || typeof lang !== 'string') return false;
  return lang in LANG_NAMES;
}

/**
 * Resolves a raw browser language tag to a supported LangCode.
 *
 * Resolution order:
 *   1. Exact match after normalisation          ('fr-FR' → 'fr-FR')
 *   2. Exact base-code match                    ('en-US' → 'en', because LANG_NAMES has 'en')
 *   3. First regional variant of the base code  ('fr'    → 'fr-FR', because LANG_NAMES has 'fr-FR')
 *   4. null - no supported language found
 */
export function resolveLang(lang: string): string | null {
  if (!lang || typeof lang !== 'string') return null;

  const normalized = normalizeLangCode(lang);

  // 1. Exact match (e.g. browser 'fr-FR' with LANG_NAMES key 'fr-FR')
  if (normalized in LANG_NAMES) {
    return normalized;
  }

  const base = normalized.split('-')[0];
  if (!base) return null;

  // 2. Exact base-code match (e.g. browser 'en-US' with LANG_NAMES key 'en')
  const exactBase = Object.keys(LANG_NAMES).find((code) => code === base);
  if (exactBase) return exactBase;

  // 3. First regional variant (e.g. browser 'fr' or 'fr-CA' with LANG_NAMES key 'fr-FR')
  const regional = Object.keys(LANG_NAMES).find((code) => code.startsWith(base + '-'));
  return regional ?? null;
}

/**
 * Normalises a BCP 47 language tag to lowercase-language + uppercase-region.
 * Examples: 'fr-fr' → 'fr-FR', 'EN-us' → 'en-US', 'fr' → 'fr'
 */
function normalizeLangCode(code: string): string {
  const trimmed = code.trim();
  const [lang, region] = trimmed.split('-');
  if (!region) return trimmed.toLowerCase();
  return `${lang?.toLowerCase()}-${region.toUpperCase()}`;
}

export async function detectLang(): Promise<string> {
  return getSystemLang() ?? DEFAULT_LOCALE;
}

export function getSystemLang(): string | null {
  if (typeof navigator === 'undefined') return null;

  const detected = navigator.languages ?? (navigator.language ? [navigator.language] : []);

  for (const lang of detected) {
    if (!lang) continue;
    const found = resolveLang(lang);
    if (found) return found;
  }

  return null;
}
