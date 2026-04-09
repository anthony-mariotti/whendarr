import { RadarrApi, type RadarrApiOptions } from '@/services/radarr/api.js';
import { readStringFromEnvironment } from '@/utils/environment.js';
import type { FastifyPluginAsync } from 'fastify';
import fastifyPlugin from 'fastify-plugin';

declare module 'fastify' {
  interface FastifyInstance {
    radarr: RadarrApi;
  }
}

const radarrPlugin: FastifyPluginAsync = async (instance) => {
  const endpoint = readStringFromEnvironment('RADARR_URL');
  if (!endpoint) throw new Error('Missing RADARR_URL');
  const key = readStringFromEnvironment('RADARR_KEY');
  if (!key) throw new Error('Missing RADARR_KEY');

  const options: RadarrApiOptions = {
    endpoint,
    key
  };

  const radarr = new RadarrApi(options);

  instance.decorate('radarr', radarr);
};

export default fastifyPlugin(radarrPlugin, {
  name: 'radarr'
});
