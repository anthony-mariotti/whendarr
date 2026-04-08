import type { FastifyInstance, FastifyPluginAsync } from 'fastify';

export async function registerServerRoute(instance: FastifyInstance) {
  return instance.register(serverV1, { prefix: '/api/v1/server' });
}

const serverV1: FastifyPluginAsync = async (app) => {
  app.get('/', async (request) => {
    return {
      data: 'test'
    };
  });
};
