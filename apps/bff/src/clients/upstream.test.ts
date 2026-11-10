import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import type { UpstreamConfig } from '../config/upstreams.ts';
import { clearTokenCache } from './token-cache.ts';
import {
  UpstreamTimeoutError,
  accessTokenFor,
  upstreamFetch,
} from './upstream.ts';

const server = setupServer();
const timeoutMs = 50;
const slowResponseMs = 200;

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  clearTokenCache();
});
afterAll(() => server.close());

function upstream(overrides: Partial<UpstreamConfig> = {}): UpstreamConfig {
  return {
    name: 'catalog',
    url: 'http://catalog.test',
    authMode: 'none',
    clientId: '',
    clientSecret: '',
    tokenUrl: '',
    timeoutMs,
    retryCount: 0,
    ...overrides,
  };
}

describe('upstream client', () => {
  it('throws when the upstream does not answer in time', async () => {
    server.use(
      http.get('http://catalog.test/items', async () => {
        await new Promise(resolve => setTimeout(resolve, slowResponseMs));
        return HttpResponse.json([]);
      }),
    );
    await expect(
      upstreamFetch(
        new Request('http://catalog.test/items'),
        upstream(),
        async () => undefined,
      ),
    ).rejects.toBeInstanceOf(UpstreamTimeoutError);
  });

  it('sends a cached client-credentials token and drops the browser cookie', async () => {
    const seen: Array<string | null> = [];
    server.use(
      http.get('http://catalog.test/items', ({ request }) => {
        seen.push(
          request.headers.get('cookie'),
          request.headers.get('authorization'),
        );
        return HttpResponse.json([]);
      }),
      http.post('http://tokens.test', () =>
        HttpResponse.json({ access_token: 'service-token', expires_in: 60 }),
      ),
    );
    const config = upstream({
      authMode: 'client-credentials',
      clientId: 'catalog',
      clientSecret: 'catalog-secret',
      tokenUrl: 'http://tokens.test',
    });
    const token = await accessTokenFor(config, 'browser-token');
    const response = await upstreamFetch(
      new Request('http://catalog.test/items', {
        headers: { cookie: 'extra=1' },
      }),
      config,
      async () => token,
    );
    expect(response.status).toBe(200);
    expect(seen).toEqual([null, 'Bearer service-token']);
    expect(await accessTokenFor(config, undefined)).toBe('service-token');
  });
});
