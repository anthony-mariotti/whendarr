import pino, { type Logger, type LoggerOptions } from 'pino';
import { isProduction, readStringFromEnvironment } from './environment.js';
import type { FastifyBaseLogger } from 'fastify';

const options: LoggerOptions = {
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
  }
};

const _logger: Logger = pino(options);
export const logger = _logger as FastifyBaseLogger;

// Re-export
export type WhendarrLogger = Logger;
