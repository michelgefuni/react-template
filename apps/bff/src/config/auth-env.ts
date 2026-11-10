import { z } from 'zod';

const minimumSecretLength = 32;
const encryptionKeyBytes = 32;

export const insecureDevSecrets = {
  session: 'development-only-session-secret-change',
  encryptionKey: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
  oidcClient: 'dev-only-client-secret-change-me-32b',
} as const;

export const authEnvSchema = z.object({
  OIDC_ISSUER_URL: z.url(),
  OIDC_CLIENT_ID: z.string().min(1),
  OIDC_CLIENT_SECRET: z.string().min(1),
  OIDC_REDIRECT_URI: z.url(),
  OIDC_POST_LOGOUT_REDIRECT_URI: z.url(),
  OIDC_SCOPES: z.string().min(1).default('openid profile email'),
  SESSION_SECRET: z.string().min(minimumSecretLength),
  SESSION_ENCRYPTION_KEY: z.string().min(1),
  SESSION_COOKIE_SECURE: z.enum(['true', 'false']).default('false'),
  SESSION_IDLE_TTL_SECONDS: z.coerce.number().int().positive().default(1800),
  SESSION_ABSOLUTE_TTL_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(28800),
  SESSION_STORE: z.enum(['memory', 'redis']).default('memory'),
  REDIS_URL: z.string().default(''),
  TOKEN_REFRESH_SKEW_SECONDS: z.coerce.number().int().nonnegative().default(30),
  OIDC_ALLOW_INSECURE_HTTP: z.enum(['true', 'false']).default('false'),
  OIDC_DISCOVERY_ATTEMPTS: z.coerce.number().int().positive().default(5),
  OIDC_DISCOVERY_DELAY_MS: z.coerce.number().int().nonnegative().default(1000),
});

export function assertAuthProduction(
  parsed: z.infer<typeof authEnvSchema> & { NODE_ENV: string },
): void {
  if (parsed.NODE_ENV !== 'production') return;
  if (parsed.SESSION_STORE === 'memory') {
    throw new Error('SESSION_STORE=memory is not allowed in production.');
  }
  if (parsed.SESSION_COOKIE_SECURE !== 'true') {
    throw new Error('SESSION_COOKIE_SECURE must be true in production.');
  }
  if (parsed.OIDC_ALLOW_INSECURE_HTTP === 'true') {
    throw new Error('OIDC_ALLOW_INSECURE_HTTP must be false in production.');
  }
  if (
    parsed.SESSION_SECRET === insecureDevSecrets.session ||
    parsed.SESSION_ENCRYPTION_KEY === insecureDevSecrets.encryptionKey ||
    parsed.OIDC_CLIENT_SECRET === insecureDevSecrets.oidcClient
  ) {
    throw new Error('Development secrets are not allowed in production.');
  }
}

export function deriveAuthEnv(parsed: z.infer<typeof authEnvSchema>) {
  const sessionCookieSecure = parsed.SESSION_COOKIE_SECURE === 'true';
  return {
    sessionCookieSecure,
    sessionCookieName: sessionCookieSecure ? '__Host-session' : 'session',
    transactionCookieName: sessionCookieSecure
      ? '__Host-oauth-txn'
      : 'oauth-txn',
    encryptionKey: decodeEncryptionKey(parsed.SESSION_ENCRYPTION_KEY),
  };
}

function decodeEncryptionKey(value: string): Buffer {
  const key = Buffer.from(value, 'base64');
  if (key.length !== encryptionKeyBytes) {
    throw new Error(
      'SESSION_ENCRYPTION_KEY must be 32 bytes encoded as base64.',
    );
  }
  return key;
}
