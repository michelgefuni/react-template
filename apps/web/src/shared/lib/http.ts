import { env } from '@/config/env';

export class HttpError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string) {
    super(code);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
  }
}

export function apiOrigin(): string {
  if (env.VITE_API_BASE_URL) return env.VITE_API_BASE_URL.replace(/\/$/, '');
  return `${window.location.origin}${env.VITE_API_BASE_PATH}`;
}

export async function httpGet<T>(path: string): Promise<T> {
  const suffix = path.startsWith('/') ? path : `/${path}`;
  const response = await fetch(`${apiOrigin()}${suffix}`);
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      code?: string;
    } | null;
    throw new HttpError(response.status, body?.code ?? 'request_failed');
  }
  return response.json() as Promise<T>;
}
