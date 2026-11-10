import winston from 'winston';

import type { Env } from './config/env.ts';

const sensitiveKeys = new Set([
  'accesstoken',
  'refreshtoken',
  'idtoken',
  'authorization',
  'cookie',
  'code',
  'password',
  'clientsecret',
  'sessionsecret',
]);

export interface Logger {
  info(object: Record<string, unknown>, message?: string): void;
  warn(object: Record<string, unknown>, message?: string): void;
  error(object: Record<string, unknown>, message?: string): void;
}

export function createLogger(env: Pick<Env, 'LOG_LEVEL'>): Logger {
  const logger = winston.createLogger({
    level: env.LOG_LEVEL === 'silent' ? 'error' : env.LOG_LEVEL,
    silent: env.LOG_LEVEL === 'silent',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json(),
    ),
    transports: [new winston.transports.Console()],
  });

  return {
    info: (object, message) => logger.info(message ?? 'info', redact(object)),
    warn: (object, message) => logger.warn(message ?? 'warn', redact(object)),
    error: (object, message) =>
      logger.error(message ?? 'error', redact(object)),
  };
}

function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(item => redact(item));
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      sensitiveKeys.has(key.toLowerCase()) ? '[redacted]' : redact(item),
    ]),
  );
}
