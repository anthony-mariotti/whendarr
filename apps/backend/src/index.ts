import Fastify from 'fastify';
import { readNumberFromEnvironment, readStringFromEnvironment } from './utils/environment.js';
import { registerCalendarRoute } from './routes/calendar/index.js';
import { registerServerRoute } from './routes/server/index.js';

import redisPlugin, { redisConnect, redisConnectTest } from './plugins/redis.js';
import dayjsPlugin from './plugins/dayjs.js';

import { registerHealthRoute } from './routes/health/index.js';
import fastifySensible from '@fastify/sensible';

const PORT = readNumberFromEnvironment('PORT', 10, 3000);
const HOST = readStringFromEnvironment('HOST', '0.0.0.0');

async function build() {
  const instance = Fastify({
    logger: {
      level: readStringFromEnvironment('LOG_LEVEL', 'info')
    },
    trustProxy: (address, hop) => {
      const trustedProxy = readStringFromEnvironment('TRUSTED_PROXY');
      const trustedHops = readNumberFromEnvironment('TRUSTED_PROXY_HOP');

      if (!trustedProxy) {
        return true;
      }

      if (trustedHops !== undefined) {
        return address === trustedProxy || hop === trustedHops;
      }

      return address === trustedProxy;
    }
  });

  await instance.register(fastifySensible);

  await instance.register(redisPlugin);
  await instance.register(dayjsPlugin);

  const redisReady = await redisConnectTest();
  if (!redisReady) {
    instance.log.warn({ redis: { ready: redisReady } }, 'Redis unavailable');
  } else {
    await redisConnect(instance);
  }

  await registerHealthRoute(instance);
  await registerServerRoute(instance);
  await registerCalendarRoute(instance);

  return instance;
}

async function start() {
  try {
    const instance = await build();
    instance.listen({ port: PORT, host: HOST }, (err, address) => {
      if (err) {
        instance.log.error(err);
        process.exit(1);
      }
    });
  } catch (err) {
    console.error('Failed to start server.', err);
    process.exit(1);
  }
}

await start();
