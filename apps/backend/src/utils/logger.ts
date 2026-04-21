import pino, { type Logger, type LoggerOptions } from 'pino';
import { isProduction, readStringFromEnvironment } from './environment.js';
import type { FastifyBaseLogger, FastifyLoggerOptions } from 'fastify';

function buildOptions(): FastifyLoggerOptions & LoggerOptions {
  return {
    level: readStringFromEnvironment('LOG_LEVEL', { default: 'info' }),
    ...(isProduction()
      ? {
          base: {
            app: 'whendarr'
          }
        }
      : {
          transport: {
            target: 'pino-pretty',
            options: {
              colorize: true,
              ignore: 'pid,hostname'
            }
          }
        }),
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'integration.req.headers.X-API-KEY'
      ],
      censor: '[redacted]'
    },
    serializers: {
      res: (reply) => {
        // The default
        return {
          code: reply.statusCode,
          cached: reply.cached ?? false
        };
      },
      req: (request) => {
        return {
          method: request.method,
          path: request.routeOptions.url,
          query: request.query,
          host: request.host,
          remoteAddress: request.ip,
          remotePort: request.socket.remotePort
        };
      }
    }
  };
}

let _logger: Logger | undefined;

function getLogger(): Logger {
  if (!_logger) {
    _logger = pino(buildOptions());
  }
  return _logger;
}

export const logger = new Proxy({} as FastifyBaseLogger, {
  get(_target, prop) {
    return (getLogger() as unknown as Record<string | symbol, unknown>)[prop];
  },
  set(_target, prop, value) {
    (getLogger() as unknown as Record<string | symbol, unknown>)[prop] = value;
    return true;
  }
});

// Re-export
export type WhendarrLogger = Logger;
