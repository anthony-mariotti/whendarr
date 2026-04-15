import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { readNumberFromEnvironment, readStringFromEnvironment } from '../utils/environment.js';
import { Redis, type RedisOptions } from 'ioredis';
import fastifyPlugin from 'fastify-plugin';
import { setCachePrefix } from '../services/cache.js';

declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis;
  }
}

const build = (
  config: Pick<RedisOptions, 'maxRetriesPerRequest' | 'connectTimeout' | 'retryStrategy'>
) => {
  let endpoint = readStringFromEnvironment('REDIS_URL');
  if (!endpoint) {
    const host = readStringFromEnvironment('REDIS_HOST');
    const port = readNumberFromEnvironment('REDIS_PORT');
    if (!host || !port || port <= 0) {
      endpoint = undefined;
    }
  }

  if (!endpoint) {
    endpoint = 'redis://localhost:6379';
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
    }
  });

  return redis;
};

const redisPlugin: FastifyPluginAsync = async (instance) => {
  const redis = build({
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

export async function redisConnectTest(): Promise<boolean> {
  try {
    const redis = build({
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
