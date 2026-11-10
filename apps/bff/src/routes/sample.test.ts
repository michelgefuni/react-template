// @sample-file
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
  clearTokenCache,
  clientCredentialsToken,
} from '../clients/token-cache.ts';
import { parseEnv } from '../config/env.ts';
import { readUpstreams } from '../config/upstreams.ts';
import { buildApp, cookiePair, environment } from '../test/harness.ts';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  clearTokenCache();
});
afterAll(() => server.close());

describe('sample upstream', () => {
  it('returns a timeout problem when an upstream does not answer', async () => {
    server.use(
      http.get('http://catalog.test/items', async () => {
        await new Promise(resolve => setTimeout(resolve, 400));
        return HttpResponse.json([]);
      }),
      http.get('http://profile.test/me', () =>
        HttpResponse.json({ id: 'user-1', displayName: 'Dev' }),
      ),
    );
    const { app } = buildApp();
    const login = await app.request('/api/auth/login?returnTo=/sample');
    const callback = await app.request(
      '/api/auth/callback?code=abc&state=state',
      {
        headers: { cookie: cookiePair(login, 'oauth-txn') },
      },
    );
    const summary = await app.request('/api/sample/summary', {
      headers: { cookie: cookiePair(callback, 'session') },
    });
    expect(summary.status).toBe(504);
    expect(await summary.json()).toMatchObject({ code: 'upstream_timeout' });
  });

  it('does not forward the browser cookie and caches client credentials', async () => {
    const seen: Array<string | null> = [];
    server.use(
      http.get('http://catalog.test/items', ({ request }) => {
        seen.push(
          request.headers.get('cookie'),
          request.headers.get('authorization'),
        );
        return HttpResponse.json([{ id: '1', name: 'Item' }]);
      }),
      http.get('http://profile.test/me', () =>
        HttpResponse.json({ id: 'user-1', displayName: 'Dev' }),
      ),
      http.post('http://tokens.test', () =>
        HttpResponse.json({ access_token: 'service-token', expires_in: 60 }),
      ),
    );
    const source = environment({
      UPSTREAM_CATALOG_AUTH_MODE: 'client-credentials',
      UPSTREAM_CATALOG_CLIENT_ID: 'catalog',
      UPSTREAM_CATALOG_CLIENT_SECRET: 'catalog-secret',
      UPSTREAM_CATALOG_TOKEN_URL: 'http://tokens.test',
    });
    const { app } = buildApp(source);
    const login = await app.request('/api/auth/login?returnTo=/sample');
    const callback = await app.request(
      '/api/auth/callback?code=abc&state=state',
      {
        headers: { cookie: cookiePair(login, 'oauth-txn') },
      },
    );
    const summary = await app.request('/api/sample/summary', {
      headers: { cookie: `${cookiePair(callback, 'session')}; extra=1` },
    });
    expect(summary.status).toBe(200);
    expect(seen).toEqual([null, 'Bearer service-token']);
    expect(
      await clientCredentialsToken(readUpstreams(source, parseEnv(source))[0]!),
    ).toBe('service-token');
  });
});
