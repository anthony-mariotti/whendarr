import { SonarrApi, type SonarrApiOptions } from '../integrations/sonarr/api.js';
import { readFromFileEnvironment } from '../utils/environment.js';
import type { FastifyPluginAsync } from 'fastify';
import fastifyPlugin from 'fastify-plugin';

declare module 'fastify' {
  interface FastifyInstance {
    sonarr: SonarrApi;
  }
}

const sonarrPlugin: FastifyPluginAsync = async (instance) => {
  const endpoint = readFromFileEnvironment('SONARR_URL', { required: true });
  const key = readFromFileEnvironment('SONARR_KEY', { required: true });

  const options: SonarrApiOptions = {
    endpoint,
    key,
    instance
  };

  const sonarr = new SonarrApi(options);

  instance.decorate('sonarr', sonarr);
};

export default fastifyPlugin(sonarrPlugin, {
  name: 'sonarr'
});
