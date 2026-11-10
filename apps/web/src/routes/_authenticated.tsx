import { createFileRoute, Outlet } from '@tanstack/react-router';

import { AuthenticatedLayout } from '@/features/auth/AuthenticatedLayout';
import { requireSession } from '@/features/auth/require-session';
import { signOut } from '@/features/auth/sign-out';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context, location }) =>
    requireSession({
      queryClient: context.queryClient,
      api: context.api,
      pathname: location.pathname,
    }),
  component: SessionLayout,
});

function SessionLayout() {
  const { me } = Route.useRouteContext();
  return (
    <AuthenticatedLayout
      name={me.name || me.email}
      onSignOut={() => void signOut()}
    >
      <Outlet />
    </AuthenticatedLayout>
  );
}
