import { serve } from '@hono/node-server';

import { createApp } from './app.ts';
import { parseEnv } from './config/env.ts';
import { readUpstreams } from './config/upstreams.ts';
import { createLogger } from './logger.ts';
// @feature-auth-start
import { RedisStore, type RedisClient } from 'hono-rate-limiter';
import Redis from 'ioredis';

import { cookieValue } from './auth/cookies.ts';
import { discoverIdentityProvider } from './auth/oidc.ts';
import { createMemoryStore, createRedisStore } from './auth/session-store.ts';
// @feature-auth-end

const env = parseEnv(process.env);
const logger = createLogger(env);
const upstreams = readUpstreams(process.env, env);
// @feature-auth-start
const sessions =
  env.SESSION_STORE === 'redis'
    ? await createRedisStore(env.REDIS_URL, env.encryptionKey)
    : createMemoryStore(env.encryptionKey);
const identity = await discoverIdentityProvider(env, logger);
const rateLimitStore =
  env.SESSION_STORE === 'redis'
    ? new RedisStore({ client: redisClient(env.REDIS_URL) })
    : undefined;
// @feature-auth-end
const app = createApp({
  env,
  logger,
  upstreams,
  // @feature-auth-start
  sessions,
  identity,
  rateLimitStore,
  clientKey: header => cookieValue(header, env.sessionCookieName),
  readiness: [() => sessions.ping()],
  // @feature-auth-end
});
const server = serve({ fetch: app.fetch, port: env.PORT }, info => {
  logger.info({ event: 'listening', port: info.port }, 'bff listening');
});

async function shutdown(): Promise<void> {
  server.close();
  // @feature-auth-start
  await sessions.close();
  // @feature-auth-end
  process.exit(0);
}

process.on('SIGTERM', () => {
  void shutdown();
});
process.on('SIGINT', () => {
  void shutdown();
});

// @feature-auth-start
function redisClient(url: string): RedisClient {
  const redis = new Redis(url, { maxRetriesPerRequest: 1 });
  return {
    scriptLoad: script => redis.script('LOAD', script),
    evalsha: (sha, keys, args) =>
      redis.evalsha(sha, keys.length, ...keys, ...(args as string[])),
    decr: key => redis.decr(key),
    del: key => redis.del(key),
  } as RedisClient;
}
// @feature-auth-end
