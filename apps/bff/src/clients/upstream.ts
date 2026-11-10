import createClient, { type Client } from 'openapi-fetch';

import type { UpstreamConfig } from '../config/upstreams.ts';
import { clientCredentialsToken } from './token-cache.ts';

const retryableMethods = new Set(['GET', 'HEAD']);
const forwardedRequestHeaders = [
  'accept',
  'content-type',
  'x-request-id',
] as const;

export class UpstreamTimeoutError extends Error {
  constructor() {
    super('Upstream timed out.');
    this.name = 'UpstreamTimeoutError';
  }
}

export async function upstreamFetch(
  request: Request,
  config: UpstreamConfig,
  getToken: () => Promise<string | undefined>,
): Promise<Response> {
  const headers = new Headers();
  for (const name of forwardedRequestHeaders) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  const token = await getToken();
  if (token) headers.set('authorization', `Bearer ${token}`);

  const method = request.method.toUpperCase();
  const body =
    method === 'GET' || method === 'HEAD'
      ? undefined
      : await request.clone().arrayBuffer();
  const attempts = retryableMethods.has(method) ? config.retryCount + 1 : 1;

  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await fetch(request.url, {
        method,
        headers,
        body,
        signal: AbortSignal.timeout(config.timeoutMs),
      });
    } catch (error) {
      lastError = error;
      if (!isTimeout(error)) throw error;
    }
  }

  if (isTimeout(lastError)) throw new UpstreamTimeoutError();
  throw lastError;
}

// openapi-fetch types paths as an interface, which does not match Record<string, unknown>.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export function createTypedClient<Paths extends {}>(
  config: UpstreamConfig,
  getToken: () => Promise<string | undefined>,
): Client<Paths> {
  return createClient<Paths>({
    baseUrl: config.url,
    fetch: request => upstreamFetch(request, config, getToken),
  });
}

export async function accessTokenFor(
  config: UpstreamConfig,
  userToken: string | undefined,
): Promise<string | undefined> {
  if (config.authMode === 'none') return undefined;
  if (config.authMode === 'user-token') return userToken;
  return clientCredentialsToken(config);
}

function isTimeout(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === 'TimeoutError' || error.name === 'AbortError')
  );
}
