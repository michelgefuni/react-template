import type { ReactNode } from 'react';

export function AuthenticatedLayout({
  name,
  onSignOut,
  children,
}: {
  name: string;
  onSignOut: () => void;
  children: ReactNode;
}) {
  return (
    <div>
      <header className="mb-8 flex items-center justify-between">
        <p>
          Signed in as <span className="font-medium">{name}</span>
        </p>
        <button type="button" className="underline" onClick={onSignOut}>
          Sign out
        </button>
      </header>
      {children}
    </div>
  );
}
