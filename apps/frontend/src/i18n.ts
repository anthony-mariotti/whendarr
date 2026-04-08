import { initI18n, detectLang, type SupportedLang } from '@whendarr/translations';

export const i18nReady = detectLang().then((lang) => initI18n({ lng: lang as SupportedLang }));

export { i18n } from '@whendarr/translations';
