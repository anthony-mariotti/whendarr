import fs from 'fs';

/**
 * Get a boolean from an environment variable. Must strictly true or false, case-insensitive
 * @param variable Expected environment variable.
 * @param defaultValue The default value when environment variable is not found.
 * @returns a true or false value
 */
export function readBooleanFromEnvironment(
  variable: ENVIRONMENT,
  defaultValue: boolean = false
): boolean {
  if (process.env[variable]) {
    return process.env[variable]?.toLowerCase() === 'true';
  }

  return defaultValue;
}

/**
 * Will read the passed environment variable as `VARIABLE_FILE` first then if not found, will use the non-file version.
 * @param variable Expected environment variable
 * @param defaultValue The default value when environment variable is not found
 * @returns The output of the file or environment variable
 */
export function readFromFileEnvironment(
  variable: ENVIRONMENT,
  defaultValue?: string | undefined
): Buffer | string | undefined {
  const path = process.env[`${variable}_FILE`];
  if (path) {
    try {
      return fs.readFileSync(path);
    } catch {
      return defaultValue;
    }
  }

  return readStringFromEnvironment(variable, defaultValue);
}

/**
 * Read an environment variable as a string, or return the default value if supplied.
 * @param variable Expected environment variable.
 * @param defaultValue The default value when environment variable is not found.
 * @returns The string of the set environment variable or the default value.
 */
export function readStringFromEnvironment(
  variable: ENVIRONMENT,
  defaultValue?: string | undefined
): string | undefined {
  const env = process.env[variable];
  if (env) {
    if (env.startsWith('http')) {
      try {
        new URL(env);
        if (env.endsWith('/')) {
          return env.slice(0, -1);
        }
      } catch {
        /* Not a URL */
      }
    }

    return process.env[variable];
  }

  return defaultValue;
}

export function readNumberFromEnvironment(
  variable: ENVIRONMENT,
  radix?: number,
  defaultValue?: number | undefined
): number | undefined {
  const value = process.env[variable];
  if (value) {
    try {
      return parseInt(value, radix);
    } catch {
      // TODO: Log when number cannot be parsed.
      return defaultValue;
    }
  }

  return defaultValue;
}

export type ENVIRONMENT =
  | 'LOG_LEVEL'
  | 'PORT'
  | 'HOST'
  | 'TRUSTED_PROXY'
  | 'TRUSTED_PROXY_HOP'
  | 'REDIS_URL'
  | 'REDIS_HOST'
  | 'REDIS_PORT'
  | 'REDIS_PREFIX'
  | 'REDIS_PASSWORD'
  | 'RADARR_URL'
  | 'RADARR_KEY'
  | 'SONARR_URL'
  | 'SONARR_KEY';
