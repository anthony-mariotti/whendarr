import 'i18next';

import { defaultNS, resources } from './config.js';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS;
    resources: (typeof resources)['en-US'];
    returnNull: false;
    returnEmptyString: false;
    // enableSelector: true;
    // ^ Uncomment to opt into the v26 selector API: t($ => $.actions.showMore)
    // instead of t('actions.showMore'). Requires updating all call sites but gives
    // better autocomplete and catches key renames at compile time.
  }
}
