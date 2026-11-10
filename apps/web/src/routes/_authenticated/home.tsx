import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/home')({
  component: HomePage,
});

function HomePage() {
  return (
    <main>
      <h1 className="text-2xl font-semibold">Workspace</h1>
      <p className="mt-3">
        The session stays on the server. This page only receives your name.
      </p>
      {/* @sample-start */}
      <a href="/sample" className="mt-6 inline-block underline">
        Open the sample
      </a>
      {/* @sample-end */}
    </main>
  );
}
