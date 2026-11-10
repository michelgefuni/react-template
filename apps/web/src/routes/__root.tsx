import {
  createRootRouteWithContext,
  Link,
  Outlet,
} from '@tanstack/react-router';

import type { RouterContext } from '@/app/router';

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  errorComponent: RootError,
  notFoundComponent: NotFound,
});

function RootLayout() {
  return (
    <div className="mx-auto min-h-screen max-w-3xl px-6 py-10">
      <Outlet />
    </div>
  );
}

function RootError({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : 'Unexpected error.';
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p role="alert" className="mt-3 text-red-700">
        {message}
      </p>
      <Link to="/" className="mt-6 inline-block underline">
        Back to start
      </Link>
    </main>
  );
}

function NotFound() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <Link to="/" className="mt-6 inline-block underline">
        Back to start
      </Link>
    </main>
  );
}
