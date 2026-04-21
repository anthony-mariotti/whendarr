import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import pino from 'pino';

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

  it('reads log level from LOG_LEVEL environment variable', async () => {
    vi.stubEnv('LOG_LEVEL', 'debug');
    await importLogger();

    expect(pinoConstructorCalls[0]?.level).toBe('debug');
  });

  it('defaults "info" when LOG_LEVEL is not set', async () => {
    vi.stubEnv('LOG_LEVEL', '');
    await importLogger();

    expect(pinoConstructorCalls[0]?.level).toBe('info');
  });

  it('defers pino construction until first use', async () => {
    const { logger } = await import('../../src/utils/logger.js');

    expect(pinoConstructorCalls).toHaveLength(0);

    vi.stubEnv('LOG_LEVEL', 'warn');
    logger.info('init');

    expect(pinoConstructorCalls[0]?.level).toBe('warn');
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

  describe('serializers', () => {
    it('req serializer returns expected fields', async () => {
      await importLogger();

      const serializers = pinoConstructorCalls[0]?.serializers as {
        req: (req: unknown) => unknown;
        res: (res: unknown) => unknown;
      };

      const mockRequest = {
        method: 'GET',
        routeOptions: { url: '/api/calendar' },
        query: { month: '2025-01' },
        host: 'localhost',
        ip: '127.0.0.1',
        socket: { remotePort: 54321 }
      };

      expect(serializers.req(mockRequest)).toEqual({
        method: 'GET',
        path: '/api/calendar',
        query: { month: '2025-01' },
        host: 'localhost',
        remoteAddress: '127.0.0.1',
        remotePort: 54321
      });
    });

    it('res serializer returns expected fields', async () => {
      await importLogger();

      const serializers = pinoConstructorCalls[0]?.serializers as {
        req: (req: unknown) => unknown;
        res: (res: unknown) => unknown;
      };

      expect(serializers.res({ statusCode: 200, cached: true })).toEqual({
        code: 200,
        cached: true
      });

      expect(serializers.res({ statusCode: 404 })).toEqual({
        code: 404,
        cached: false
      });
    });
  });

  describe('proxy', () => {
    it('forwards property sets through underlying logger', async () => {
      const logger = await importLogger();

      logger.level = 'debug';

      expect(logger.level).toBe('debug');
    });
  });
});
