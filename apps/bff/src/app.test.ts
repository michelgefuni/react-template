import { describe, expect, it } from 'vitest';

import { buildApp, environment } from './test/harness.ts';
import { parseEnv } from './config/env.ts';
import { readUpstreams } from './config/upstreams.ts';
import { createApp } from './app.ts';
import type { Logger } from './logger.ts';

const silentLogger: Logger = { info() {}, warn() {}, error() {} };

describe('core routes', () => {
  it('answers health and readiness', async () => {
    const { app } = buildApp();
    expect((await app.request('/api/health')).status).toBe(200);
    expect((await app.request('/api/ready')).status).toBe(200);
  });

  it('reports not ready when a check fails', async () => {
    const source = environment();
    const env = parseEnv(source);
    // @feature-auth-start
    const { sessions, identity } = buildApp(source);
    // @feature-auth-end
    const app = createApp({
      env,
      logger: silentLogger,
      upstreams: readUpstreams(source, env),
      readiness: [async () => false],
      // @feature-auth-start
      sessions,
      identity,
      // @feature-auth-end
    });
    expect((await app.request('/api/ready')).status).toBe(503);
  });
});
