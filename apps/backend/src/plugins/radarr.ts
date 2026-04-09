import { RadarrApi, type RadarrApiOptions } from '@/integrations/radarr/api.js';
import { readFromFileEnvironment, readStringFromEnvironment } from '@/utils/environment.js';
import type { FastifyPluginAsync } from 'fastify';
import fastifyPlugin from 'fastify-plugin';

declare module 'fastify' {
  interface FastifyInstance {
    radarr: RadarrApi;
  }
}

const radarrPlugin: FastifyPluginAsync = async (instance) => {
  const endpoint = readFromFileEnvironment('RADARR_URL', { required: true });
  const key = readFromFileEnvironment('RADARR_KEY', { required: true });

  const options: RadarrApiOptions = {
    endpoint,
    key,
    instance
  };

  const radarr = new RadarrApi(options);

  instance.decorate('radarr', radarr);
};

export default fastifyPlugin(radarrPlugin, {
  name: 'radarr'
});
