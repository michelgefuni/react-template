import type { QueryClient } from '@tanstack/react-query';
import { createRouter } from '@tanstack/react-router';

// @feature-bff-start
import type { ApiClient } from '@/shared/lib/bff-client';
// @feature-bff-end
import { routeTree } from '@/routeTree.gen';

export interface RouterContext {
  queryClient: QueryClient;
  // @feature-bff-start
  api: ApiClient;
  // @feature-bff-end
}

export function createAppRouter(
  queryClient: QueryClient,
  // @feature-bff-start
  api: ApiClient,
  // @feature-bff-end
) {
  return createRouter({
    routeTree,
    context: {
      queryClient,
      // @feature-bff-start
      api,
      // @feature-bff-end
    },
  });
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
