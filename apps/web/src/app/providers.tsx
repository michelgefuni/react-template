import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { useState } from 'react';

import { createQueryClient } from '@/app/query-client';
import { createAppRouter } from '@/app/router';
// @feature-bff-start
import { createApiClient } from '@/shared/lib/bff-client';
// @feature-bff-end

export function App() {
  const [queryClient] = useState(createQueryClient);
  const [router] = useState(() =>
    createAppRouter(
      queryClient,
      // @feature-bff-start
      createApiClient(),
      // @feature-bff-end
    ),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
