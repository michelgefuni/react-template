import { createFileRoute } from '@tanstack/react-router';

// @feature-auth-start
import { SignInLink } from '@/features/auth/SignInLink';
// @feature-auth-end

export const Route = createFileRoute('/')({
  component: LandingPage,
});

export function LandingPage() {
  return (
    <main>
      <h1 className="text-3xl font-semibold">React Template</h1>
      <p className="mt-4 max-w-xl text-lg">
        React starter. The backend for frontend and sign-in are optional.
      </p>
      {/* @feature-auth-start */}
      <SignInLink />
      {/* @feature-auth-end */}
    </main>
  );
}
