import { existsSync, readFileSync } from 'fs';

interface BuildVersion {
  version: string;
  tag: string | null;
  commit: string | null;
  date: string | null;
}

const BUILD_INFO_PATH = '/srv/whendarr/.build-info.json';

export function loadVersionInfo(): BuildVersion {
  if (existsSync(BUILD_INFO_PATH)) {
    try {
      const content = readFileSync(BUILD_INFO_PATH, 'utf-8');
      const parsed = JSON.parse(content) as Record<string, string>;
      return {
        version: parsed.version || '0.0.0',
        tag: parsed.tag || null,
        commit: parsed.commit || null,
        date: parsed.date || null
      };
    } catch {
      /* Fallback to ENV */
    }
  }

  return {
    version: process.env.APP_VERSION ?? '0.0.0',
    tag: process.env.APP_TAG ?? null,
    commit: process.env.APP_COMMIT ?? null,
    date: process.env.APP_BUILD_DATE ?? null
  };
}

const info = loadVersionInfo();

export function getCurrentVersion(): string {
  return info.version;
}

export function getCurrentTag(): string | null {
  return info.tag;
}

export function getCurrentCommit(): string | null {
  return info.commit;
}

export function getCurrentBuildDate(): string | null {
  return info.date;
}

export function getBuildVersion(): Readonly<BuildVersion> {
  return {
    ...info
  };
}
