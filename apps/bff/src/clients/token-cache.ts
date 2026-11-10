import { z } from 'zod';

import type { UpstreamConfig } from '../config/upstreams.ts';

const tokenResponseSchema = z.object({
  access_token: z.string(),
  expires_in: z.number().positive(),
});

interface CachedToken {
  token: string;
  expiresAt: number;
}

const cache = new Map<string, CachedToken>();

export async function clientCredentialsToken(
  config: UpstreamConfig,
): Promise<string> {
  const cached = cache.get(config.name);
  if (cached && cached.expiresAt > Date.now()) return cached.token;

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      accept: 'application/json',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }),
    signal: AbortSignal.timeout(config.timeoutMs),
  });

  if (!response.ok) {
    throw new Error('Client credentials request failed.');
  }

  const payload = tokenResponseSchema.parse(await response.json());
  cache.set(config.name, {
    token: payload.access_token,
    expiresAt: Date.now() + payload.expires_in * 1000,
  });
  return payload.access_token;
}

export function clearTokenCache(): void {
  cache.clear();
}
