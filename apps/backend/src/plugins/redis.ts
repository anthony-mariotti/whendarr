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
      const targetError = 'READONLY';
      if (err.message.includes(targetError)) {
        return true;
      }
      return false;
    },
    tls
  });

  return redis;
};

const redisPlugin: FastifyPluginAsync = async (instance) => {
  const redis = build(instance, {
    retryStrategy: (times: number) => {
      const delay = Math.max(times * 50, 2000);
      return delay;
    }
  });

  redis.on('connect', () => {
    instance.log.info('Redis Connected');
  });

  redis.on('error', (err: Error) => {
    instance.log.error({ err }, 'Redis error');
  });

  instance.decorate('redis', redis);

  instance.addHook('onClose', async () => {
    if (redis.status === 'ready' || redis.status === 'connecting') {
      await redis.quit();
    }
  });
};

export async function redisConnect(instance: FastifyInstance): Promise<void> {
  if (instance.redis.status === 'ready') return;
  await instance.redis.connect();
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
