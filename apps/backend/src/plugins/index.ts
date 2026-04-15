import type { FastifyInstance } from 'fastify';
import redisPlugin from './redis.js';
import dayjsPlugin from './dayjs.js';
import radarrPlugin from './radarr.js';
import sonarrPlugin from './sonarr.js';

export async function registerPlugins(instance: FastifyInstance) {
  await instance.register(redisPlugin);
  await instance.register(dayjsPlugin);
  await instance.register(radarrPlugin);
  await instance.register(sonarrPlugin);
}
