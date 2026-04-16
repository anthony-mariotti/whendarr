import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'fs';

import {
  isDevelopment,
  isProduction,
  readBooleanFromEnvironment,
  readFromFileEnvironment,
  readNumberFromEnvironment,
  readStringFromEnvironment,
  type ENVIRONMENT
} from '../../src/utils/environment.js';

describe('readBooleanFromEnvironment', () => {
  const ENV_VAR: ENVIRONMENT = 'REDIS_TLS';

  beforeEach(() => {
    delete process.env[ENV_VAR];
  });

  afterEach(() => {
    delete process.env[ENV_VAR];
  });

  describe('when environment variable is set', () => {
    it('returns true when env is "true" (lowercase)', () => {
      process.env[ENV_VAR] = 'true';
      const result = readBooleanFromEnvironment(ENV_VAR);
      expect(result).toBe(true);
    });

    it('returns true when env is "TRUE" (uppercase)', () => {
      process.env[ENV_VAR] = 'TRUE';
      const result = readBooleanFromEnvironment(ENV_VAR);
      expect(result).toBe(true);
    });

    it('return false when env is "false" (lowercase)', () => {
      process.env[ENV_VAR] = 'false';
      const result = readBooleanFromEnvironment(ENV_VAR);
      expect(result).toBe(false);
    });

    it('return false when env is "FALSE" (uppercase)', () => {
      process.env[ENV_VAR] = 'FALSE';
      const result = readBooleanFromEnvironment(ENV_VAR);
      expect(result).toBe(false);
    });

    it('returns false when env is anything other than "true"', () => {
      process.env[ENV_VAR] = 'yes';
      const result = readBooleanFromEnvironment(ENV_VAR);
      expect(result).toBe(false);
    });
  });

  describe('when environment variable is missing', () => {
    it('returns provided default value', () => {
      const result = readBooleanFromEnvironment(ENV_VAR, { default: true });
      expect(result).toBe(true);
    });

    it('returns false by default', () => {
      const result = readBooleanFromEnvironment(ENV_VAR);
      expect(result).toBe(false);
    });

    it('returns false when required is true', () => {
      const result = readBooleanFromEnvironment(ENV_VAR, { required: true });
      expect(result).toBe(false);
    });
  });

  describe('when environment variable is empty string', () => {
    beforeEach(() => {
      process.env[ENV_VAR] = '';
    });

    it('returns false by default', () => {
      process.env[ENV_VAR] = '';
      const result = readBooleanFromEnvironment(ENV_VAR);
      expect(result).toBe(false);
    });

    it('returns default value', () => {
      const result = readBooleanFromEnvironment(ENV_VAR, { default: true });
      expect(result).toBe(true);
    });

    it('returns false when required is true', () => {
      const result = readBooleanFromEnvironment(ENV_VAR, { required: true });
      expect(result).toBe(false);
    });
  });
});

describe('readStringFromEnvironment', () => {
  const ENV_VAR: ENVIRONMENT = 'RADARR_URL';

  beforeEach(() => {
    delete process.env[ENV_VAR];
  });

  afterEach(() => {
    delete process.env[ENV_VAR];
  });

  describe('when environment variable is set', () => {
    it('returns value as-is', () => {
      const expected = 'radarr';
      process.env[ENV_VAR] = expected;
      const result = readStringFromEnvironment(ENV_VAR);
      expect(result).toBe(expected);
    });

    it('returns URL without trailing slash', () => {
      process.env[ENV_VAR] = 'http://radarr.domain.tld/';
      const result = readStringFromEnvironment(ENV_VAR);
      expect(result).toBe('http://radarr.domain.tld');
    });

    it('returns URL without modification', () => {
      const expected = 'http://radarr.domain.tld';
      process.env[ENV_VAR] = expected;
      const result = readStringFromEnvironment(ENV_VAR);
      expect(result).toBe(expected);
    });

    it('returns invalid URL as-is', () => {
      const expected = 'http://radarr domain tld';
      process.env[ENV_VAR] = expected;
      const result = readStringFromEnvironment(ENV_VAR);
      expect(result).toBe(expected);
    });

    it('returns any url scheme without modification', () => {
      const expected = 'ftp://radarr.domain.tld';
      process.env[ENV_VAR] = expected;
      const result = readStringFromEnvironment(ENV_VAR);
      expect(result).toBe(expected);
    });
  });

  describe('when environment variable is missing', () => {
    it('returns undefined as default', () => {
      const result = readStringFromEnvironment(ENV_VAR);
      expect(result).toBeUndefined();
    });

    it('returns provided default value', () => {
      const expected = 'fallback';
      const result = readStringFromEnvironment(ENV_VAR, { default: expected });
      expect(result).toBe(expected);
    });

    it('throws when required is true', () => {
      expect(() => {
        readStringFromEnvironment(ENV_VAR, { required: true });
      }).toThrow(`Missing required environment variable: ${ENV_VAR}`);
    });

    it('throws even if default is provided when required is true', () => {
      expect(() => {
        readStringFromEnvironment(ENV_VAR, { required: true, default: 'fallback' });
      }).toThrow(`Missing required environment variable: ${ENV_VAR}`);
    });
  });

  describe('when environment variable is empty string', () => {
    beforeEach(() => {
      process.env[ENV_VAR] = '';
    });

    it('returns default treating empty string as missing', () => {
      const expected = 'fallback';
      const result = readStringFromEnvironment(ENV_VAR, { default: expected });
      expect(result).toBe(expected);
    });

    it('returns undefined when no default is provided', () => {
      const result = readStringFromEnvironment(ENV_VAR);
      expect(result).toBeUndefined();
    });

    it('throws when required is true', () => {
      expect(() => {
        readStringFromEnvironment(ENV_VAR, { required: true });
      }).toThrow(`Missing required environment variable: ${ENV_VAR}`);
    });
  });
});

describe('readNumberFromEnvironment', () => {
  const ENV_VAR: ENVIRONMENT = 'PORT';

  beforeEach(() => {
    delete process.env[ENV_VAR];
  });

  afterEach(() => {
    delete process.env[ENV_VAR];
  });

  describe('when environment variable is set', () => {
    it('returns parsed base 10 number as default', () => {
      process.env[ENV_VAR] = '42';
      const result = readNumberFromEnvironment(ENV_VAR);
      expect(result).toBe(42);
    });

    it('returns parsed with a custom radix', () => {
      process.env[ENV_VAR] = '1010';
      const result = readNumberFromEnvironment(ENV_VAR, 2);
      expect(result).toBe(10);
    });

    it('returns parsed number with leading spaces', () => {
      process.env[ENV_VAR] = '   15';
      const result = readNumberFromEnvironment(ENV_VAR);
      expect(result).toBe(15);
    });

    it('returns default when NaN is provided', () => {
      process.env[ENV_VAR] = 'not-a-number';
      const result = readNumberFromEnvironment(ENV_VAR, 10, { default: 5 });
      expect(result).toBe(5);
    });

    it('returns undefined for invalid number with no default', () => {
      process.env[ENV_VAR] = 'abc';
      const result = readNumberFromEnvironment(ENV_VAR);
      expect(result).toBeUndefined();
    });

    it('throws for invalid number when required is true', () => {
      process.env[ENV_VAR] = 'abc';
      expect(() => {
        readNumberFromEnvironment(ENV_VAR, 10, { required: true });
      }).toThrow(`Invalid number for environment variable: ${ENV_VAR}`);
    });
  });

  describe('when environment variable is missing', () => {
    it('returns undefined by default', () => {
      expect(readNumberFromEnvironment(ENV_VAR)).toBeUndefined();
    });

    it('returns provided default value', () => {
      expect(readNumberFromEnvironment(ENV_VAR, 10, { default: 99 })).toBe(99);
    });

    it('throws when required is true', () => {
      expect(() => {
        readNumberFromEnvironment(ENV_VAR, 10, { required: true });
      }).toThrow(`Missing required environment variable: ${ENV_VAR}`);
    });

    it('throws when default is provided and required is true', () => {
      expect(() => {
        readNumberFromEnvironment(ENV_VAR, 10, { required: true, default: 99 });
      }).toThrow(`Missing required environment variable: ${ENV_VAR}`);
    });
  });

  describe('when environment variable is an empty string', () => {
    beforeEach(() => {
      process.env[ENV_VAR] = '';
    });

    it('returns default value', () => {
      const result = readNumberFromEnvironment(ENV_VAR, 10, { default: 99 });
      expect(result).toBe(99);
    });

    it('return undefined with no default', () => {
      const result = readNumberFromEnvironment(ENV_VAR);
      expect(result).toBeUndefined();
    });

    it('throws when required is true', () => {
      expect(() => {
        readNumberFromEnvironment(ENV_VAR, 10, { required: true });
      }).throws(`Missing required environment variable: ${ENV_VAR}`);
    });
  });
});

describe('readFromFileEnvironment', () => {
  const ENV_VAR: ENVIRONMENT = 'RADARR_KEY';
  const FILE_VAR = `${ENV_VAR}_FILE`;

  beforeEach(() => {
    delete process.env[ENV_VAR];
    delete process.env[FILE_VAR];
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('when _FILE is set and valid', () => {
    it('returns read file and trims file content', () => {
      process.env[FILE_VAR] = '/fake/path';
      vi.spyOn(fs, 'readFileSync').mockReturnValue('  abc   ');
      const result = readFromFileEnvironment(ENV_VAR);
      expect(result).toBe('abc');
    });
  });

  describe('when _FILE is set but fails to read', () => {
    beforeEach(() => {
      process.env[FILE_VAR] = '/bad/path';
      vi.spyOn(fs, 'readFileSync').mockImplementation(() => {
        throw new Error('fail');
      });
    });

    it('returns falback string environment variable when not required', () => {
      process.env[ENV_VAR] = 'fallback';
      const result = readFromFileEnvironment(ENV_VAR);
      expect(result).toBe('fallback');
    });

    it('returns default when environment variable is not set', () => {
      const result = readFromFileEnvironment(ENV_VAR, { default: 'secret' });
      expect(result).toBe('secret');
    });

    it('throws when required is true', () => {
      expect(() => {
        readFromFileEnvironment(ENV_VAR, { required: true });
      }).toThrow(`Failed to read file for required environment variable: ${ENV_VAR}_FILE`);
    });
  });

  describe('when _FILE is not set', () => {
    it('returns fallback string environment variable', () => {
      process.env[ENV_VAR] = 'fallback';
      const result = readFromFileEnvironment(ENV_VAR);
      expect(result).toBe('fallback');
    });

    it('returns default default if environment is missing', () => {
      const result = readFromFileEnvironment(ENV_VAR, { default: 'cookies' });
      expect(result).toBe('cookies');
    });

    it('throws when required is true', () => {
      expect(() => {
        readFromFileEnvironment(ENV_VAR, { required: true });
      }).toThrow(`Missing required environment variable: ${ENV_VAR}`);
    });
  });

  describe('when _FILE is empty string', () => {
    beforeEach(() => {
      process.env[FILE_VAR] = '';
    });

    it('returns fallback treating as not set', () => {
      process.env[ENV_VAR] = 'fallback';
      const result = readFromFileEnvironment(ENV_VAR);
      expect(result).toBe('fallback');
    });
  });

  describe('priority behavior', () => {
    it('prefers file over environment variable when both are set', () => {
      process.env[FILE_VAR] = '/fake/path';
      process.env[ENV_VAR] = 'env-value';
      vi.spyOn(fs, 'readFileSync').mockReturnValue('file-value');
      const result = readFromFileEnvironment(ENV_VAR);
      expect(result).toBe('file-value');
    });
  });
});

describe('environment utility', () => {
  const ENV_VAR: ENVIRONMENT = 'NODE_ENV';

  beforeEach(() => {
    delete process.env[ENV_VAR];
  });

  afterEach(() => {
    delete process.env[ENV_VAR];
  });

  describe('when NODE_ENV is not set', () => {
    it('defaults to development', () => {
      expect(isDevelopment()).toBe(true);
      expect(isProduction()).toBe(false);
    });
  });

  describe('when NODE_ENV is "development"', () => {
    beforeEach(() => {
      process.env[ENV_VAR] = 'development';
    });

    it('returns correct values', () => {
      expect(isDevelopment()).toBe(true);
      expect(isProduction()).toBe(false);
    });
  });

  describe('when NODE_ENV is "production"', () => {
    beforeEach(() => {
      process.env[ENV_VAR] = 'production';
    });

    it('returns correct values', () => {
      expect(isDevelopment()).toBe(false);
      expect(isProduction()).toBe(true);
    });
  });

  describe('case insensitivity', () => {
    it('handles uppercase values', () => {
      process.env[ENV_VAR] = 'PRODUCTION';

      expect(isProduction()).toBe(true);
      expect(isDevelopment()).toBe(false);
    });
  });

  describe('when NODE_ENV is empty string', () => {
    beforeEach(() => {
      process.env[ENV_VAR] = '';
    });

    it('treats empty as development', () => {
      expect(isDevelopment()).toBe(true);
      expect(isProduction()).toBe(false);
    });
  });

  describe('when NODE_ENV is unknown value', () => {
    beforeEach(() => {
      process.env[ENV_VAR] = 'staging';
    });

    it('returns false for both', () => {
      expect(isDevelopment()).toBe(false);
      expect(isProduction()).toBe(false);
    });
  });
});
