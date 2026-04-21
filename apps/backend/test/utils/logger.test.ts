import pino from 'pino';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const pinoConstructorCalls: pino.LoggerOptions[] = [];

vi.mock('pino-pretty', () => ({
  default: vi.fn()
}));

vi.mock('pino', async (importOriginal) => {
  const actual = await importOriginal<{ default: typeof import('pino') }>();
  return {
    default: vi.fn((options: pino.LoggerOptions) => {
      pinoConstructorCalls.push(options);
      return actual.default(options);
    })
  };
});

async function importLogger() {
  const { logger } = await import('../../src/utils/logger.js');
  return logger;
}

describe('logger', () => {
  beforeEach(() => {
    vi.resetModules();
    pinoConstructorCalls.length = 0;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('reads log level from LOG_LEVEL env var', async () => {
    vi.stubEnv('LOG_LEVEL', 'debug');
    await importLogger();

    expect(pinoConstructorCalls[0]?.level).toBe('debug');
  });

  it('defaults log level to "info" when LOG_LEVEL is not set', async () => {
    vi.stubEnv('LOG_LEVEL', '');
    await importLogger();

    expect(pinoConstructorCalls[0]?.level).toBe('info');
  });

  it('uses pino-pretty transport in development', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    await importLogger();

    expect(pinoConstructorCalls[0]?.transport).toEqual(
      expect.objectContaining({ target: 'pino-pretty' })
    );
  });

  it('does not use pino-pretty transport in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    await importLogger();

    expect(pinoConstructorCalls[0]?.transport).toBeUndefined();
  });

  it('includes app base field in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    await importLogger();

    expect(pinoConstructorCalls[0]?.base).toEqual(expect.objectContaining({ app: 'whendarr' }));
  });
});
