import { env } from '@/config/env';

const csrfHeader = 'x-csrf-token';

export async function signOut(): Promise<void> {
  const response = await fetch(`${env.VITE_API_BASE_PATH}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
    headers: { [csrfHeader]: '1' },
  });
  const body = (await response.json()) as { logoutUrl?: string };
  window.location.assign(body.logoutUrl ?? '/');
}
