// @sample-file
import { useQuery } from '@tanstack/react-query';

import type { ApiClient } from '@/shared/lib/bff-client';

interface Summary {
  items: Array<{ id: string; name: string }>;
  profile: { id: string; displayName: string };
}

export function SampleSummary({ api }: { api: ApiClient }) {
  const query = useQuery({
    queryKey: ['sample', 'summary'],
    queryFn: async (): Promise<Summary> => {
      const response = await api.sample.summary.$get();
      if (!response.ok) throw new Error('Could not load the sample.');
      return response.json();
    },
  });

  if (query.isPending) return <p role="status">Loading sample.</p>;
  if (query.isError) {
    return (
      <p role="alert" className="text-red-700">
        {query.error.message}
      </p>
    );
  }
  if (query.data.items.length === 0) return <p>No items yet.</p>;

  return (
    <section>
      <h2 className="text-lg font-medium">{query.data.profile.displayName}</h2>
      <ul className="mt-3 list-disc pl-5">
        {query.data.items.map(item => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </section>
  );
}
