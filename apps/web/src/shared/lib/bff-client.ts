import { hcWithType, type ApiClient } from '@react-template/bff/client';

import { env } from '@/config/env';

const csrfHeader = 'x-csrf-token';

export type { ApiClient };

export function createApiClient(): ApiClient {
  return hcWithType(`${window.location.origin}${env.VITE_API_BASE_PATH}`, {
    fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      headers.set(csrfHeader, '1');
      const response = await fetch(input, {
        ...init,
        headers,
        credentials: 'include',
      });
      if (response.status === 401 && !String(input).includes('/auth/')) {
        const returnTo = window.location.pathname;
        window.location.assign(
          `${env.VITE_API_BASE_PATH}/auth/login?returnTo=${encodeURIComponent(returnTo)}`,
        );
      }
      return response;
    },
  });
}
