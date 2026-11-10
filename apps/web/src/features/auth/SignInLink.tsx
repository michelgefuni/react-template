import { env } from '@/config/env';

export function SignInLink({ returnTo = '/home' }: { returnTo?: string }) {
  const href = `${env.VITE_API_BASE_PATH}/auth/login?returnTo=${encodeURIComponent(returnTo)}`;
  return (
    <a
      className="mt-8 inline-block rounded bg-slate-900 px-4 py-2 text-white"
      href={href}
    >
      Sign in
    </a>
  );
}
