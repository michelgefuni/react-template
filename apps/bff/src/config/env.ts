import { z } from 'zod';

// @feature-auth-start
import {
  assertAuthProduction,
  authEnvSchema,
  deriveAuthEnv,
} from './auth-env.ts';
// @feature-auth-end

export const coreEnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  API_BASE_PATH: z
    .string()
    .startsWith('/')
    .refine(value => !value.endsWith('/') || value === '/')
    .default('/api'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
  TRUST_PROXY: z.enum(['true', 'false']).default('false'),
  CORS_ALLOWED_ORIGINS: z.string().default(''),
  UPSTREAM_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
  UPSTREAM_RETRY_COUNT: z.coerce.number().int().nonnegative().default(1),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  BODY_LIMIT_BYTES: z.coerce.number().int().positive().default(1_048_576),
});

// prettier-ignore
const envSchema = coreEnvSchema
  // @feature-auth-start
  .extend(authEnvSchema.shape);
// @feature-auth-end
export type Env = z.infer<typeof envSchema> & {
  trustProxy: boolean;
  corsAllowedOrigins: string[];
  // @feature-auth-start
  sessionCookieSecure: boolean;
  sessionCookieName: string;
  transactionCookieName: string;
  encryptionKey: Buffer;
  // @feature-auth-end
};

export function parseEnv(source: Record<string, string | undefined>): Env {
  const parsed = envSchema.parse(source);
  // @feature-auth-start
  assertAuthProduction(parsed);
  if (parsed.SESSION_STORE === 'redis' && !parsed.REDIS_URL) {
    throw new Error('REDIS_URL is required when SESSION_STORE is redis.');
  }
  // @feature-auth-end

  return {
    ...parsed,
    trustProxy: parsed.TRUST_PROXY === 'true',
    corsAllowedOrigins: parsed.CORS_ALLOWED_ORIGINS.split(',')
      .map(origin => origin.trim())
      .filter(Boolean),
    // @feature-auth-start
    ...deriveAuthEnv(parsed),
    // @feature-auth-end
  };
}
