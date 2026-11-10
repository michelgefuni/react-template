import { z } from 'zod';

import type { Env } from './env.ts';

const authModes = ['user-token', 'client-credentials', 'none'] as const;

export type UpstreamAuthMode = (typeof authModes)[number];

export interface UpstreamConfig {
  name: string;
  url: string;
  authMode: UpstreamAuthMode;
  clientId: string;
  clientSecret: string;
  tokenUrl: string;
  timeoutMs: number;
  retryCount: number;
}

const upstreamNamePattern = /^UPSTREAM_([A-Z0-9]+)_URL$/;

const upstreamSchema = z.object({
  url: z.url(),
  authMode: z.enum(authModes),
  clientId: z.string().default(''),
  clientSecret: z.string().default(''),
  tokenUrl: z.string().default(''),
});

export function readUpstreams(
  source: Record<string, string | undefined>,
  env: Pick<Env, 'UPSTREAM_TIMEOUT_MS' | 'UPSTREAM_RETRY_COUNT'>,
): UpstreamConfig[] {
  return Object.keys(source).flatMap(key => {
    const match = upstreamNamePattern.exec(key);
    const rawName = match?.[1];
    if (!rawName) return [];

    const parsed = upstreamSchema.parse({
      url: source[`UPSTREAM_${rawName}_URL`],
      authMode: source[`UPSTREAM_${rawName}_AUTH_MODE`] ?? 'none',
      clientId: source[`UPSTREAM_${rawName}_CLIENT_ID`] ?? '',
      clientSecret: source[`UPSTREAM_${rawName}_CLIENT_SECRET`] ?? '',
      tokenUrl: source[`UPSTREAM_${rawName}_TOKEN_URL`] ?? '',
    });

    if (parsed.authMode === 'client-credentials') {
      if (!parsed.clientId || !parsed.clientSecret || !parsed.tokenUrl) {
        throw new Error(
          `Upstream ${rawName} requires client id, client secret and token url.`,
        );
      }
      z.url().parse(parsed.tokenUrl);
    }

    return [
      {
        name: rawName.toLowerCase(),
        url: parsed.url,
        authMode: parsed.authMode,
        clientId: parsed.clientId,
        clientSecret: parsed.clientSecret,
        tokenUrl: parsed.tokenUrl,
        timeoutMs: env.UPSTREAM_TIMEOUT_MS,
        retryCount: env.UPSTREAM_RETRY_COUNT,
      },
    ];
  });
}
