// @feature-auth-start
import type {
  IdentityProvider,
  IssuedTokens,
} from '../auth/identity-provider.ts';
import { createMemoryStore } from '../auth/session-store.ts';
// @feature-auth-end
import { parseEnv } from '../config/env.ts';
import { readUpstreams } from '../config/upstreams.ts';
import { createApp } from '../app.ts';
import type { Logger } from '../logger.ts';

const silentLogger: Logger = { info() {}, warn() {}, error() {} };

export function environment(
  overrides: Record<string, string> = {},
): Record<string, string> {
  return {
    NODE_ENV: 'test',
    LOG_LEVEL: 'silent',
    // @feature-auth-start
    OIDC_ISSUER_URL: 'http://idp.test/realms/app',
    OIDC_CLIENT_ID: 'web-bff',
    OIDC_CLIENT_SECRET: 'test-client-secret-value-32-bytes!!',
    OIDC_REDIRECT_URI: 'http://localhost:5173/api/auth/callback',
    OIDC_POST_LOGOUT_REDIRECT_URI: 'http://localhost:5173/',
    SESSION_SECRET: 'test-session-secret-value-32-bytes!',
    SESSION_ENCRYPTION_KEY: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
    SESSION_COOKIE_SECURE: 'false',
    SESSION_STORE: 'memory',
    // @feature-auth-end
    UPSTREAM_CATALOG_URL: 'http://catalog.test',
    UPSTREAM_CATALOG_AUTH_MODE: 'none',
    UPSTREAM_PROFILE_URL: 'http://profile.test',
    UPSTREAM_PROFILE_AUTH_MODE: 'user-token',
    UPSTREAM_TIMEOUT_MS: '200',
    UPSTREAM_RETRY_COUNT: '0',
    ...overrides,
  };
}

export function buildApp(
  source = environment(),
  options: { readiness?: Array<() => Promise<boolean>> } = {},
) {
  const env = parseEnv(source);
  // @feature-auth-start
  const sessions = createMemoryStore(env.encryptionKey);
  const identity = fakeIdentity();
  // @feature-auth-end
  const readiness = options.readiness ?? [];
  const app = createApp({
    env,
    logger: silentLogger,
    upstreams: readUpstreams(source, env),
    readiness,
    // @feature-auth-start
    sessions,
    identity,
    // @feature-auth-end
  });
  return {
    app,
    env,
    // @feature-auth-start
    sessions,
    identity,
    // @feature-auth-end
  };
}

export function cookiePair(response: Response, name: string): string {
  const cookies =
    typeof response.headers.getSetCookie === 'function'
      ? response.headers.getSetCookie()
      : [response.headers.get('set-cookie') ?? ''];
  const match = cookies.find(cookie => cookie.startsWith(`${name}=`));
  return (match ?? '').split(';')[0] ?? '';
}

// @feature-auth-start
function tokens(accessToken = 'access-token'): IssuedTokens {
  return {
    accessToken,
    refreshToken: 'refresh-token',
    idToken: 'id-token',
    expiresInSeconds: 300,
    sub: 'user-1',
    name: 'Dev User',
    email: 'dev@example.com',
  };
}

function fakeIdentity(): IdentityProvider {
  return {
    async createTransaction(returnTo) {
      return {
        transaction: {
          state: 'state',
          nonce: 'nonce',
          codeVerifier: 'verifier',
          returnTo,
        },
        authorizationUrl: new URL('http://idp.test/authorize?state=state'),
      };
    },
    async exchange(currentUrl, transaction) {
      if (currentUrl.searchParams.get('state') !== transaction.state) {
        throw new Error('state mismatch');
      }
      return tokens();
    },
    async refresh() {
      return tokens('refreshed-token');
    },
    logoutUrl: () => 'http://idp.test/logout',
  };
}
// @feature-auth-end
