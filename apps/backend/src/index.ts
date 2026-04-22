import Fastify, { type FastifyInstance } from 'fastify';
import fastifySensible from '@fastify/sensible';
import fastifyStatic from '@fastify/static';
import { resolve } from 'path';
import { existsSync, readFileSync } from 'fs';
import { config } from 'dotenv';

import {
  isDevelopment,
  isProduction,
  readNumberFromEnvironment,
  readStringFromEnvironment
} from './utils/environment.js';
import { registerPlugins } from './plugins/index.js';
import { redisConnect, redisConnectTest } from './plugins/redis.js';
import { createCacheService } from './services/cache.js';
import { registerHealthRoute } from './routes/health.js';
import { registerServerRoute } from './routes/server/index.js';
import { registerCalendarRoute } from './routes/calendar/index.js';
import { registerVersionRoute } from './routes/version.js';
import { logger } from './utils/logger.js';

const PROJECT_ROOT = resolve(process.cwd(), isDevelopment() ? '../..' : '');
config({ path: resolve(PROJECT_ROOT, '.env'), quiet: true });

const PORT = readNumberFromEnvironment('PORT', 10, { default: 3000 });
const HOST = readStringFromEnvironment('HOST', { default: '0.0.0.0' });
const BASE_PATH =
  readStringFromEnvironment('BASE_PATH')?.replace(/\/+$/, '').replace(/^\/?/, '/') || '';
const TRUSTED_PROXY = readStringFromEnvironment('TRUSTED_PROXY');
const TRUSTED_PROXY_HOP = readNumberFromEnvironment('TRUSTED_PROXY_HOP');

function createServer(): FastifyInstance {
  return Fastify({
    loggerInstance: logger,
    trustProxy: TRUSTED_PROXY ?? TRUSTED_PROXY_HOP,
    rewriteUrl: (req) => {
      const url = req.url ?? '/';
      if (BASE_PATH && (url.startsWith(`${BASE_PATH}/`) || url === BASE_PATH)) {
        return url.slice(BASE_PATH.length) || '/';
      }
      return url;
    }
  });
}

async function registerAppPlugins(app: FastifyInstance): Promise<void> {
  app.log.info('Server registering application plugins');
  app.addHook('onRequest', async (request) => {
    if (!request.headers['content-type']) {
      delete request.headers['transfer-encoding'];
    }
  });

  await app.register(fastifySensible);
  await registerPlugins(app);

  const redisReady = await redisConnectTest(app);
  if (!redisReady) {
    app.log.warn('Server caching unavailable');
  } else {
    await redisConnect(app);
  }

  createCacheService(app.redis);
}

async function registerRoutes(app: FastifyInstance): Promise<void> {
  app.log.info('Server registering application routes');
  await registerHealthRoute(app);
  await registerServerRoute(app);
  await registerCalendarRoute(app);
  await registerVersionRoute(app);
}

async function serveFrontend(app: FastifyInstance): Promise<void> {
  const frontend = resolve(PROJECT_ROOT, isDevelopment() ? 'apps/frontend/dist' : 'frontend');

  if (!isProduction() || !existsSync(frontend)) return;
  app.log.info('Server serving frontend via static files');

  const cachedIndex = readFileSync(resolve(frontend, 'index.html'), 'utf-8');
  await app.register(fastifyStatic, {
    root: frontend,
    prefix: '/',
    serve: false,
    redirect: true,
    logLevel: 'warn'
  });

  app.setNotFoundHandler(async (request, reply) => {
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

async function build(): Promise<FastifyInstance> {
  const app = createServer();

  switch (app.log.level) {
    case 'trace':
      app.log.trace('Server trace enabled');
      break;
    case 'debug':
      app.log.debug('Server debug enabled');
      break;
  }

  app.log.info(
    {
      production: isProduction(),
      host: HOST,
      port: PORT,
      basePath: BASE_PATH,
      trustedProxy: TRUSTED_PROXY,
      trustedProxyHop: TRUSTED_PROXY_HOP
    },
    'Initializing backend'
  );

  await registerAppPlugins(app);
  await registerRoutes(app);
  await serveFrontend(app);

  return app;
}

async function start(): Promise<void> {
  try {
    const app = await build();
    app.listen(
      {
        port: PORT,
        host: HOST
      },
      (err) => {
        if (err) {
          app.log.error(err);
          process.exit(1);
        }
      }
    );
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
}

start();
