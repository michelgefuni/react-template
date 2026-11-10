import type { Store } from 'hono-rate-limiter';

import type { Env } from './config/env.ts';
import type { UpstreamConfig } from './config/upstreams.ts';
import type { Logger } from './logger.ts';
// @feature-auth-start
import type { IdentityProvider } from './auth/identity-provider.ts';
import type { Session, SessionStore } from './auth/session-store.ts';
// @feature-auth-end

export interface AppDependencies {
  env: Env;
  logger: Logger;
  upstreams: UpstreamConfig[];
  rateLimitStore?: Store;
  readiness?: Array<() => Promise<boolean>>;
  clientKey?: (cookieHeader: string | undefined) => string | undefined;
  // @feature-auth-start
  sessions: SessionStore;
  identity: IdentityProvider;
  // @feature-auth-end
}

export type AppBindings = {
  Variables: {
    requestId: string;
    // @feature-auth-start
    session: Session | null;
    // @feature-auth-end
  };
};
