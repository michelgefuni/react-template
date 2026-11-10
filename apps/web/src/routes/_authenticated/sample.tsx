// @sample-file
import { createFileRoute } from '@tanstack/react-router';

import { SampleSummary } from '@/features/sample/SampleSummary';

export const Route = createFileRoute('/_authenticated/sample')({
  component: SamplePage,
});

function SamplePage() {
  const { api } = Route.useRouteContext();
  return (
    <main>
      <h1 className="text-2xl font-semibold">Sample</h1>
      <SampleSummary api={api} />
    </main>
  );
}
