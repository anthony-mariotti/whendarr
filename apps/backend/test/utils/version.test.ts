import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'fs';

import { loadVersionInfo } from '../../src/utils/version.js';

vi.mock('fs');

describe('loadVesrionInfo', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    delete process.env.APP_VERSION;
    delete process.env.APP_TAG;
    delete process.env.APP_COMMIT;
    delete process.env.APP_BUILD_DATE;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns from file when it exists and valid', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'readFileSync').mockReturnValue(
      JSON.stringify({
        version: '1.2.3',
        tag: 'v1.2.3',
        commit: 'abc123',
        date: '2026-04-17T04:48:39.306Z'
      })
    );

    const result = loadVersionInfo();

    expect(result).toEqual({
      version: '1.2.3',
      tag: 'v1.2.3',
      commit: 'abc123',
      date: '2026-04-17T04:48:39.306Z'
    });
  });

  it('returns defaults for missing fields', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'readFileSync').mockReturnValue('{}');

    const result = loadVersionInfo();

    expect(result).toEqual({
      version: '0.0.0',
      tag: null,
      commit: null,
      date: null
    });
  });

  it('returns environment vars when JSON is invalid', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'readFileSync').mockReturnValue('invalid-json');

    process.env.APP_VERSION = '2.0.0';
    process.env.APP_TAG = 'v2';
    process.env.APP_COMMIT = 'def456';
    process.env.APP_BUILD_DATE = '2026-04-17T04:48:39.306Z';

    const result = loadVersionInfo();

    expect(result).toEqual({
      version: '2.0.0',
      tag: 'v2',
      commit: 'def456',
      date: '2026-04-17T04:48:39.306Z'
    });
  });

  it('returns environment vars when file does not exist', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(false);

    process.env.APP_VERSION = '3.0.0';
    process.env.APP_TAG = 'v3';
    process.env.APP_COMMIT = 'ghi789';
    process.env.APP_BUILD_DATE = '2026-04-17T04:48:39.306Z';

    const result = loadVersionInfo();

    expect(result).toEqual({
      version: '3.0.0',
      tag: 'v3',
      commit: 'ghi789',
      date: '2026-04-17T04:48:39.306Z'
    });
  });

  it('returns defaults when environment vars is missing', () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(false);

    const result = loadVersionInfo();

    expect(result).toEqual({
      version: '0.0.0',
      tag: null,
      commit: null,
      date: null
    });
  });
});

describe('getCurrent* helpers', () => {
  const MODULE_PATH = '../../src/utils/version.js';

  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();

    delete process.env.APP_VERSION;
    delete process.env.APP_TAG;
    delete process.env.APP_COMMIT;
    delete process.env.APP_BUILD_DATE;
  });

  async function loadFreshModule() {
    return await import(MODULE_PATH);
  }

  it('returns values from file', async () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'readFileSync').mockReturnValue(
      JSON.stringify({
        version: '9.9.9',
        tag: 'v9',
        commit: 'zzz',
        date: '2026-04-17T04:48:39.306Z'
      })
    );

    const mod = await loadFreshModule();

    expect(mod.getCurrentVersion()).toBe('9.9.9');
    expect(mod.getCurrentTag()).toBe('v9');
    expect(mod.getCurrentCommit()).toBe('zzz');
    expect(mod.getCurrentBuildDate()).toBe('2026-04-17T04:48:39.306Z');
  });

  it('returns values from env when missing file', async () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(false);

    process.env.APP_VERSION = '8.6.7';
    process.env.APP_TAG = 'v6.3.2';
    process.env.APP_COMMIT = 'ghi867';
    process.env.APP_BUILD_DATE = '2026-04-17T04:48:39.306Z';

    const mod = await loadFreshModule();

    expect(mod.getCurrentVersion()).toBe('8.6.7');
    expect(mod.getCurrentTag()).toBe('v6.3.2');
    expect(mod.getCurrentCommit()).toBe('ghi867');
    expect(mod.getCurrentBuildDate()).toBe('2026-04-17T04:48:39.306Z');
  });
});

describe('getBuildVersion', () => {
  const MODULE_PATH = '../../../src/utils/version.ts';

  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();

    delete process.env.APP_VERSION;
    delete process.env.APP_TAG;
    delete process.env.APP_COMMIT;
    delete process.env.APP_BUILD_DATE;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function loadFreshModule() {
    return await import(MODULE_PATH);
  }

  it('returns a fresh copy', async () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(false);
    process.env.APP_VERSION = '8.6.7';
    process.env.APP_TAG = 'v6.3.2';
    process.env.APP_COMMIT = 'ghi867';
    process.env.APP_BUILD_DATE = '2026-04-17T04:48:39.306Z';

    const mod = await loadFreshModule();

    const result = mod.getBuildVersion();

    expect(result).toEqual({
      version: '8.6.7',
      tag: 'v6.3.2',
      commit: 'ghi867',
      date: '2026-04-17T04:48:39.306Z'
    });

    expect(result).not.toBe(mod.info);
  });
});
