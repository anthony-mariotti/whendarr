import { getCurrentVersion } from '$lib/utils/buildInfo';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => {
  return {
    appVersion: getCurrentVersion()
  };
};
