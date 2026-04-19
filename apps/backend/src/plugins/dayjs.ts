import fastifyPlugin from 'fastify-plugin';

import dayjs from 'dayjs';
import isTodayPlugin from 'dayjs/plugin/isToday.js';
import utcPlugin from 'dayjs/plugin/utc.js';
import relativeTimePlugin from 'dayjs/plugin/relativeTime.js';
import isBetweenPlugin from 'dayjs/plugin/isBetween.js';
import timezonePlugin from 'dayjs/plugin/timezone.js';
import customParseFormatPlugin from 'dayjs/plugin/customParseFormat.js';

import type { FastifyInstance } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    dayjs: typeof dayjs;
  }
}

function dayjsPlugin(instance: FastifyInstance) {
  dayjs.extend(isTodayPlugin);
  dayjs.extend(utcPlugin);
  dayjs.extend(relativeTimePlugin);
  dayjs.extend(isBetweenPlugin);
  dayjs.extend(timezonePlugin);
  dayjs.extend(customParseFormatPlugin);

  instance.decorate('dayjs', dayjs);

  return dayjs;
}

export default fastifyPlugin(dayjsPlugin, {
  name: 'dayjs'
});
