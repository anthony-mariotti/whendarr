import type { HealthCheck, ServiceHealthCheck } from '@whendarr/shared';
import dayjs from 'dayjs';
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';

async function checkRedis(instance: FastifyInstance): Promise<ServiceHealthCheck> {
  if (instance.redis.server?.status !== 'ready') {
    return {
      status: 'unhealthy'
    };
  }
  try {
    const pong = await instance.redis.server.ping();
    return {
      status: pong === 'PONG' ? 'healthy' : 'unhealthy'
    };
  } catch {
    return {
      status: 'unhealthy'
    };
  }
}

const health: FastifyPluginAsync = async (instance) => {
  instance.get<{
    Reply: HealthCheck;
  }>('/health', async () => {
    const [sonarr, radarr, redis] = await Promise.all([
      instance.sonarr.health(),
      instance.radarr.health(),
      checkRedis(instance)
    ]);

    const degraded = [sonarr, radarr, redis].some((health) => health.status !== 'healthy');

    return {
      status: degraded ? 'degraded' : 'healthy',
      checks: {
        sonarr,
        radarr,
        redis
      },
      uptime: Math.floor(process.uptime()),
      timestamp: dayjs.utc().unix()
    } as HealthCheck;
  });
};

export async function registerHealthRoute(instance: FastifyInstance) {
  return instance.register(health);
}
