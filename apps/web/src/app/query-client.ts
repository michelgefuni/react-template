import { QueryClient } from '@tanstack/react-query';

import { queryConfig } from '@/config/query';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: queryConfig.staleTimeMs,
        retry: false,
      },
    },
  });
}
