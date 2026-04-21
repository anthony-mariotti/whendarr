import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { Redis, type RedisOptions } from 'ioredis';
import fastifyPlugin from 'fastify-plugin';
import fs from 'fs';
import type { ConnectionOptions } from 'tls';

import {
  readBooleanFromEnvironment,
  readFromFileEnvironment,
  readNumberFromEnvironment,
  readStringFromEnvironment
} from '../utils/environment.js';
import { setCachePrefix } from '../services/cache.js';

declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis;
  }
}

const CONNECTION_ERROR_PATTERNS = [
  'ECONNREFUSED',
  'ECONNRESET',
  'ENOTFOUND',
  'ETIMEDOUT',
  'NR_CLOSED',
  'Connection is closed',
  "Stream isn't writeable"
] as const;

function isConnectionError(err: Error): boolean {
  return CONNECTION_ERROR_PATTERNS.some(
    (pattern) => err.message.includes(pattern) || (err as NodeJS.ErrnoException).code === pattern
  );
}

const build = (
  instance: FastifyInstance,
  config: Pick<RedisOptions, 'maxRetriesPerRequest' | 'connectTimeout' | 'retryStrategy'>
) => {
  let endpoint = buildRedisEndpoint(instance);
  let tls: ConnectionOptions | undefined;

  if (!endpoint) {
    endpoint = `redis://localhost:6379`;
  }

  if (endpoint.startsWith('rediss://')) {
    tls = buildTlsOptions(instance);
  }

  const prefix = readStringFromEnvironment('REDIS_PREFIX');
  if (prefix) {
    setCachePrefix(prefix);
  }

  const redis = new Redis(endpoint, {
    lazyConnect: true,
    maxRetriesPerRequest: config.maxRetriesPerRequest,
    connectTimeout: config.connectTimeout,
    retryStrategy: config.retryStrategy,
    reconnectOnError: (err: Error) => {
      return err.message.includes('READONLY');
    },
    tls
  });

  return redis;
};

const redisPlugin: FastifyPluginAsync = async (instance) => {
  const redis = build(instance, {
    retryStrategy: (times: number) => {
      const delay = Math.min(1000 * 60, Math.round(Math.pow(1.2, times) * 750));

      if (times > 20) return null;
      instance.log.trace({ times, delay }, 'Server cache reconnecting...');
      return delay;
    }
  });

  let hasWarnedDisconnect = false;

  redis.on('connect', () => {
    if (hasWarnedDisconnect) {
      instance.log.info('Server caching reconnected');
    } else {
      instance.log.info('Server caching connected');
    }
    hasWarnedDisconnect = false;
  });

  redis.on('close', () => {
    if (!hasWarnedDisconnect) {
      hasWarnedDisconnect = true;
      instance.log.warn('Server caching disconnected');
    }
  });

  redis.on('reconnecting', () => {
    // Supress
  });

  redis.on('end', (err: Error) => {
    instance.log.warn({ err }, 'Server caching unavailable');
  });

  redis.on('error', (err: Error) => {
    if (isConnectionError(err)) {
      if (!hasWarnedDisconnect) {
        hasWarnedDisconnect = true;
        instance.log.warn({ err }, 'Server caching unavailable');
      }
      return;
    }
    instance.log.error({ err }, 'Redis error');
  });

  instance.decorate('redis', redis);

  instance.addHook('onClose', async () => {
    if (redis.status === 'ready' || redis.status === 'connecting') {
      await redis.quit();
    } else {
      redis.disconnect();
    }
  });
};

export async function redisConnect(instance: FastifyInstance): Promise<boolean> {
  if (instance.redis.status === 'ready') return true;

  try {
    await instance.redis.connect();
    return true;
  } catch (err) {
    // If Redis isn't available at startup that's fine — we'll run without caching.
    instance.log.warn({ err }, 'Server caching unavailable at startup');
    return false;
  }
}

function noop() {}

export async function redisConnectTest(instance: FastifyInstance): Promise<boolean> {
  try {
    const redis = build(instance, {
      connectTimeout: 5000,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null
    });

    redis.on('error', noop);

    try {
      await redis.connect();
      const pong = await redis.ping();
      return pong === 'PONG';
    } finally {
      redis.disconnect();
    }
  } catch {
    return false;
  }
}

export default fastifyPlugin(redisPlugin, {
  name: 'redis'
});

function buildRedisEndpoint(instance: FastifyInstance) {
  try {
    const redisUrl = readFromFileEnvironment('REDIS_URL');

    if (redisUrl) {
      return redisUrl;
    } else {
      const host = readStringFromEnvironment('REDIS_HOST', { default: 'localhost' });
      const port = readNumberFromEnvironment('REDIS_PORT', 10, { default: 6379 });

      const username = readFromFileEnvironment('REDIS_USERNAME');
      const password = readFromFileEnvironment('REDIS_PASSWORD');

      const useTls = readBooleanFromEnvironment('REDIS_TLS') || port === 6380;

      const protocol = useTls ? 'rediss' : 'redis';

      let auth = '';
      if (username && password) {
        auth = `${encodeURIComponent(username)}:${encodeURIComponent(password)}@`;
      } else if (password) {
        auth = `:${encodeURIComponent(password)}@`;
      } else if (username) {
        auth = `${encodeURIComponent(username)}@`;
      }

      return `${protocol}://${auth}${host}:${port}`;
    }
  } catch (err) {
    instance.log.error(err, 'Failed to build redis endpoint url');
    return undefined;
  }
}

function buildTlsOptions(instance: FastifyInstance): ConnectionOptions {
  try {
    const rejectUnauthorized = readBooleanFromEnvironment('REDIS_TLS_REJECT_UNAUTHORIZED', {
      default: true
    });

    const caPath = readFromFileEnvironment('REDIS_TLS_CA');
    const certPath = readFromFileEnvironment('REDIS_TLS_CERT');
    const keyPath = readFromFileEnvironment('REDIS_TLS_KEY');

    const tls: ConnectionOptions = {
      rejectUnauthorized
    };

    if (caPath) {
      tls.ca = fs.readFileSync(caPath);
    }

    if (certPath) {
      tls.cert = fs.readFileSync(certPath);
    }

    if (keyPath) {
      tls.key = fs.readFileSync(keyPath);
    }

    return tls;
  } catch (err) {
    instance.log.fatal(err, 'Failed to initialize redis TLS options');
    process.exit(1);
  }
}
