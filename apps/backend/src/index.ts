import Fastify from 'fastify';
import fastifySensible from '@fastify/sensible';
import fastifyStatic from '@fastify/static';
import { redisConnect, redisConnectTest } from './plugins/redis.js';

import {
  isDevelopment,
  isProduction,
  readNumberFromEnvironment,
  readStringFromEnvironment
} from './utils/environment.js';
import { registerCalendarRoute } from './routes/calendar/index.js';
import { registerServerRoute } from './routes/server/index.js';
import { registerHealthRoute } from './routes/health/index.js';

import { resolve } from 'path';
import { existsSync, readFileSync } from 'fs';

import { config } from 'dotenv';

import { registerPlugins } from './plugins/index.js';
import servicesPlugin from '@/services/index.js';

const PROJECT_ROOT = resolve(process.cwd(), isDevelopment() ? '../..' : '');
config({ path: resolve(PROJECT_ROOT, '.env'), quiet: true });

const PORT = readNumberFromEnvironment('PORT', 10, { default: 3000 });
const HOST = readStringFromEnvironment('HOST', { default: '0.0.0.0' });
const BASE_PATH =
  readStringFromEnvironment('BASE_PATH')?.replace(/\/+$/, '').replace(/^\/?/, '/') || '';
const TRUSTED_PROXY = readStringFromEnvironment('TRUSTED_PROXY');
const TRUSTED_PROXY_HOP = readNumberFromEnvironment('TRUSTED_PROXY_HOP');

async function build() {
  const instance = Fastify({
    logger: {
      level: readStringFromEnvironment('LOG_LEVEL', { default: 'info' }),
      transport: isDevelopment()
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined
    },
    trustProxy: (address, hop) => {
      if (!TRUSTED_PROXY) {
        return true;
      }

      if (TRUSTED_PROXY_HOP !== undefined) {
        return address === TRUSTED_PROXY || hop === TRUSTED_PROXY_HOP;
      }

      return address === TRUSTED_PROXY;
    },
    rewriteUrl: (req) => {
      const url = req.url ?? '/';
      if (BASE_PATH) {
        if (url.startsWith(`${BASE_PATH}/`) || url === BASE_PATH) {
          return url.slice(BASE_PATH.length) || '/';
        }
      }

      return url;
    }
  });

  instance.log.debug(
    {
      production: isProduction(),
      host: HOST,
      port: PORT,
      basePath: BASE_PATH,
      trustedProxy: TRUSTED_PROXY,
      trustedProxyHop: TRUSTED_PROXY_HOP
    },
    'Initializing Backend'
  );

  instance.addHook('onRequest', async (request) => {
    if (!request.headers['content-type']) {
      delete request.headers['transfer-encoding'];
    }
  });

  await instance.register(fastifySensible);

  await registerPlugins(instance);
  await instance.register(servicesPlugin);

  const redisReady = await redisConnectTest();
  if (!redisReady) {
    instance.log.warn({ redis: { ready: redisReady } }, 'Redis unavailable');
  } else {
    await redisConnect(instance);
  }

  await registerHealthRoute(instance);
  await registerServerRoute(instance);
  await registerCalendarRoute(instance);

  // Serve Frontend
  const frontend = resolve(PROJECT_ROOT, isDevelopment() ? 'apps/frontend/dist' : 'frontend');
  const exists = existsSync(frontend);
  if (isProduction() && exists) {
    instance.log.info(
      { frontend, isProduction: isProduction(), exists },
      'Serving frontend via static file for production'
    );

    const index = resolve(frontend, 'index.html');
    const cachedIndex = readFileSync(index, 'utf-8');

    await instance.register(fastifyStatic, {
      root: frontend,
      prefix: '/',
      serve: false,
      redirect: true,
      logLevel: 'trace'
    });

    instance.setNotFoundHandler(async (request, reply) => {
      if (request.url.startsWith('/api/') || request.url === 'health') {
        return reply.notFound();
      }

      if (BASE_PATH) {
        const { originalUrl } = request;
        if (!originalUrl.startsWith(`${BASE_PATH}/`) && originalUrl !== BASE_PATH) {
          return reply.redirect(`${BASE_PATH}/`);
        }
      }

      const urlPath = request.url.split('?')[0]!;
      if (urlPath !== '/' && /\.\w+$/.test(urlPath)) {
        const filePath = urlPath.slice(1);
        const fullPath = resolve(frontend, filePath);

        if (existsSync(fullPath)) {
          return reply.sendFile(filePath);
        }
      }

      const base = BASE_PATH ? `${BASE_PATH}/` : '/';
      const html = cachedIndex.replace('<head>', `<head>\n    <base href="${base}">`);
      return reply.type('text/html').send(html);
    });
  }

  return instance;
}

async function start() {
  try {
    const instance = await build();
    instance.listen({ port: PORT, host: HOST }, (err) => {
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

(async () => {
  await start();
})();
