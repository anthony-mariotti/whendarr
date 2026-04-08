import type { FastifyInstance, FastifyPluginAsync } from 'fastify';

export async function registerHealthRoute(instance: FastifyInstance) {
  return instance.register(health);
}

const health: FastifyPluginAsync = async (app) => {
  app.get('/health', async (request) => {
    return {
      status: 'ok'
    };
  });
};
