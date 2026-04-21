import pino, { type Logger, type LoggerOptions } from 'pino';
import { isProduction, readStringFromEnvironment } from './environment.js';
import type { FastifyBaseLogger, FastifyLoggerOptions } from 'fastify';

const options: FastifyLoggerOptions & LoggerOptions = {
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
    paths: ['req.headers.authorization', 'req.headers.cookie'],
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

const _logger: Logger = pino(options);
export const logger = _logger as FastifyBaseLogger;

// Re-export
export type WhendarrLogger = Logger;
