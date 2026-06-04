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

export const logger: FastifyBaseLogger = pino(buildOptions());

// Re-export
export type WhendarrLogger = Logger;
