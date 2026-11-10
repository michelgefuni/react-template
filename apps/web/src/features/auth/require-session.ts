import type { QueryClient } from '@tanstack/react-query';
import { redirect } from '@tanstack/react-router';

import type { ApiClient } from '@/shared/lib/bff-client';
import { env } from '@/config/env';

interface Me {
  id: string;
  name: string;
  email: string;
}

export async function requireSession(input: {
  queryClient: QueryClient;
  api: ApiClient;
  pathname: string;
}): Promise<{ me: Me }> {
  const me = await input.queryClient.ensureQueryData({
    queryKey: ['auth', 'me'],
    queryFn: () => loadMe(input.api),
  });
  if (!me) {
    throw redirect({
      href: `${env.VITE_API_BASE_PATH}/auth/login?returnTo=${encodeURIComponent(input.pathname)}`,
    });
  }
  return { me };
}

export async function loadMe(api: ApiClient): Promise<Me | null> {
  const response = await api.auth.me.$get();
  if (response.status === 401) return null;
  if (!response.ok) throw new Error('Could not load the session.');
  return response.json();
}
