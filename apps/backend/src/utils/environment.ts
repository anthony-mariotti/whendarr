import fs from 'fs';

/**
 * Options for reading environment variables
 * @template T The expected default type
 */
export interface EnvironmentOptions<T> {
  default?: T;
  required?: boolean;
}

/**
 * Get a boolean from an environment variable. Must strictly true or false, case-insensitive
 * @param variable Expected environment variable.
 * @param defaultValue The default value when environment variable is not found.
 * @returns a true or false value
 */
export function readBooleanFromEnvironment(
  variable: ENVIRONMENT,
  options: EnvironmentOptions<boolean> = { required: false }
): boolean {
  if (process.env[variable]) {
    return process.env[variable]?.toLowerCase() === 'true';
  }

  return options?.default ?? false;
}

export function readFromFileEnvironment(variable: ENVIRONMENT): string | undefined;

export function readFromFileEnvironment(variable: ENVIRONMENT, options: { required: true }): string;

export function readFromFileEnvironment(
  variable: ENVIRONMENT,
  options: { required: false }
): string | undefined;

export function readFromFileEnvironment(
  variable: ENVIRONMENT,
  options: EnvironmentOptions<string>
): string | undefined;

/**
 * Reads an environment variable from a file or the corresponding variable.
 *
 * If `${variable}_FILE` is set, then the file will be read and returned
 * Otherwise, fallback to reading the non-file version of the environment variable.
 *
 * @param variable Environment variable to read
 * @param options Optional configuration
 * @returns The file contents as a Buffer, the fallback environment variable as a tring, or default value if supplied
 * @throws Error only if fallback environment variable is not set and required
 */
export function readFromFileEnvironment(
  variable: ENVIRONMENT,
  options: EnvironmentOptions<string> = { required: false }
): string | undefined {
  const path = process.env[`${variable}_FILE`];

  if (path) {
    try {
      const value = fs.readFileSync(path);
      if (Buffer.isBuffer(value)) {
        return value.toString('utf-8').trim();
      }
      return value;
    } catch {
      /* Fallback */
    }
  }

  return readStringFromEnvironment(variable, options);
}

export function readStringFromEnvironment(variable: ENVIRONMENT): string | undefined;

export function readStringFromEnvironment(
  variable: ENVIRONMENT,
  options: { required: false }
): string | undefined;

export function readStringFromEnvironment(
  variable: ENVIRONMENT,
  options: { required: true }
): string;

export function readStringFromEnvironment(
  variable: ENVIRONMENT,
  options: EnvironmentOptions<string>
): string;

/**
 * Read an environment variable as a string, or return the default value if supplied.
 *
 * @param variable Environment variable to read
 * @param options Optional configuration
 * @returns The value of the environment variable, or the default value
 * @throws Error if the environment variable is required and not set
 */
export function readStringFromEnvironment(
  variable: ENVIRONMENT,
  options: EnvironmentOptions<string> = { required: false }
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

  if (options?.required) {
    throw new Error(`Missing required ${variable} environment variable.`);
  }

  return options?.default;
}

export function readNumberFromEnvironment(variable: ENVIRONMENT): number | undefined;

export function readNumberFromEnvironment(variable: ENVIRONMENT, radix: number): number | undefined;

export function readNumberFromEnvironment(
  variable: ENVIRONMENT,
  radix: number,
  options: { required: false }
): number | undefined;

export function readNumberFromEnvironment(
  variable: ENVIRONMENT,
  radix: number,
  options: { required: true }
): number;

export function readNumberFromEnvironment(
  variable: ENVIRONMENT,
  radix: number,
  options: EnvironmentOptions<number>
): number | undefined;

/**
 *
 * @param variable
 * @param radix
 * @param options
 * @returns
 */
export function readNumberFromEnvironment(
  variable: ENVIRONMENT,
  radix: number = 10,
  options: EnvironmentOptions<number> = { required: false }
): number | undefined {
  const value = process.env[variable];

  if (value) {
    try {
      return parseInt(value, radix);
    } catch {
      /* Fallback */
    }
  }

  if (options?.required) {
    throw new Error(`Missing required ${variable} environment variable.`);
  }

  return options?.default;
}

/**
 * Determines if the `NODE_ENV` is development. Assumes that if the `NODE_ENV` is not set, then the current environment is development
 *
 * @returns `true` if development or not set, otherwise `false`
 */
export function isDevelopment(): boolean {
  return readStringFromEnvironment('NODE_ENV', { default: 'development' }) !== 'production';
}

/**
 * Determines if the `NODE_ENV` is production. Assumes that if the `NODE_ENV` is not set, then the current environment is production
 *
 * @returns `true` if production or not set, otherwise `false`
 */
export function isProduction(): boolean {
  return readStringFromEnvironment('NODE_ENV', { default: 'production' }) === 'production';
}

export type ENVIRONMENT =
  | 'NODE_ENV'
  | 'LOG_LEVEL'
  | 'PORT'
  | 'HOST'
  | 'BASE_PATH'
  | 'TRUSTED_PROXY'
  | 'TRUSTED_PROXY_HOP'
  | 'REDIS_URL'
  | 'REDIS_HOST'
  | 'REDIS_PORT'
  | 'REDIS_PREFIX'
  | 'REDIS_USERNAME'
  | 'REDIS_PASSWORD'
  | 'REDIS_TLS'
  | 'REDIS_TLS_CA'
  | 'REDIS_TLS_CERT'
  | 'REDIS_TLS_KEY'
  | 'REDIS_TLS_REJECT_UNAUTHORIZED'
  | 'RADARR_URL'
  | 'RADARR_KEY'
  | 'SONARR_URL'
  | 'SONARR_KEY';
