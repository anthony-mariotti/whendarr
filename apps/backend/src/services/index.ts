import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { CalendarService } from './calendar.js';
import fastifyPlugin from 'fastify-plugin';

declare module 'fastify' {
  interface FastifyInstance {
    services: WhendarrServices;
  }
}

class WhendarrServices {
  calendar: CalendarService;

  constructor(instance: FastifyInstance) {
    this.calendar = new CalendarService(instance);
  }
}

const servicesPlugin: FastifyPluginAsync = async (instance) => {
  const services = new WhendarrServices(instance);
  instance.decorate('services', services);
};

export default fastifyPlugin(servicesPlugin, {
  name: 'services'
});
