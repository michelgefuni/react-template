import { describe, expect, it } from 'vitest';

import { encryptJson } from './crypto.ts';
import { sanitizeReturnTo } from './return-to.ts';
import { buildApp, cookiePair, environment } from '../test/harness.ts';
import { parseEnv } from '../config/env.ts';

describe('auth', () => {
  it('rejects external return targets', () => {
    expect(sanitizeReturnTo('https://evil.example')).toBe('/');
    expect(sanitizeReturnTo('//evil.example')).toBe('/');
    expect(sanitizeReturnTo('/home')).toBe('/home');
  });

  it('stores session tokens only as ciphertext', async () => {
    const { env, sessions } = buildApp();
    await sessions.save({
      id: 'session-id',
      sub: 'user-1',
      name: 'Dev',
      email: 'dev@example.com',
      accessToken: 'plain-access-token',
      refreshToken: 'plain-refresh-token',
      idToken: 'plain-id-token',
      accessTokenExpiresAt: Date.now() + 60_000,
      createdAt: Date.now(),
      idleExpiresAt: Date.now() + 60_000,
      absoluteExpiresAt: Date.now() + 60_000,
    });
    const raw = sessions.backing.get('session:session-id') ?? '';
    expect(raw).not.toContain('plain-access-token');
    expect(raw).not.toContain('plain-refresh-token');
    expect((await sessions.read('session-id'))?.accessToken).toBe(
      'plain-access-token',
    );
    expect(env.sessionCookieName).toBe('session');
  });

  it('refuses memory sessions and development secrets in production', () => {
    expect(() =>
      parseEnv(
        environment({ NODE_ENV: 'production', SESSION_STORE: 'memory' }),
      ),
    ).toThrow(/memory/);
    expect(() =>
      parseEnv(
        environment({
          NODE_ENV: 'production',
          SESSION_STORE: 'redis',
          REDIS_URL: 'redis://localhost:6379',
          SESSION_COOKIE_SECURE: 'true',
        }),
      ),
    ).toThrow(/Development secrets/);
  });

  it('requires a session for protected routes and reports the signed-in user', async () => {
    const { app } = buildApp();
    expect((await app.request('/api/sample/summary')).status).toBe(401);
    expect((await app.request('/api/auth/me')).status).toBe(401);

    const login = await app.request('/api/auth/login?returnTo=/home');
    const callback = await app.request(
      '/api/auth/callback?code=abc&state=state',
      {
        headers: { cookie: cookiePair(login, 'oauth-txn') },
      },
    );
    expect(callback.headers.get('location')).toBe('/home');

    const me = await app.request('/api/auth/me', {
      headers: { cookie: cookiePair(callback, 'session') },
    });
    expect(await me.json()).toEqual({
      id: 'user-1',
      name: 'Dev User',
      email: 'dev@example.com',
    });
  });

  it('ignores an external return target', async () => {
    const { app } = buildApp();
    const login = await app.request(
      '/api/auth/login?returnTo=https://evil.example',
    );
    const callback = await app.request(
      '/api/auth/callback?code=abc&state=state',
      {
        headers: { cookie: cookiePair(login, 'oauth-txn') },
      },
    );
    expect(callback.headers.get('location')).toBe('/');
  });

  it('rejects logout without the csrf header and returns the provider logout url', async () => {
    const { app } = buildApp();
    const rejected = await app.request('/api/auth/logout', { method: 'POST' });
    expect(rejected.status).toBe(403);

    const accepted = await app.request(
      'http://localhost:5173/api/auth/logout',
      {
        method: 'POST',
        headers: { 'x-csrf-token': '1', origin: 'http://localhost:5173' },
      },
    );
    expect(accepted.status).toBe(200);
    expect(await accepted.json()).toEqual({
      logoutUrl: 'http://localhost:5173/',
    });
  });

  it('roundtrips json without writing the plaintext token', () => {
    const key = Buffer.from(
      'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
      'base64',
    );
    const payload = encryptJson({ accessToken: 'secret-token' }, key);
    expect(payload).not.toContain('secret-token');
  });
});
