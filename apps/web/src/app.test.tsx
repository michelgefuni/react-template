import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { env } from '@/config/env';
import { LandingPage } from '@/routes/index';
import { cn } from '@/shared/lib/cn';
// @feature-auth-start
import { fireEvent } from '@testing-library/react';

import { AuthenticatedLayout } from '@/features/auth/AuthenticatedLayout';
// @feature-auth-end
// @sample-start
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { SampleSummary } from '@/features/sample/SampleSummary';
import type { ApiClient } from '@/shared/lib/bff-client';
// @sample-end

describe('web building blocks', () => {
  it('reads the api base path from the environment', () => {
    expect(env.VITE_API_BASE_PATH).toBe('/api');
  });

  it('merges class names', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('shows the landing heading', () => {
    render(<LandingPage />);
    expect(
      screen.getByRole('heading', { name: 'React Template' }),
    ).toBeInTheDocument();
  });

  // @feature-auth-start
  it('links sign in to the bff', () => {
    render(<LandingPage />);
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
      'href',
      '/api/auth/login?returnTo=%2Fhome',
    );
  });

  it('shows who is signed in', () => {
    let signedOut = false;
    render(
      <AuthenticatedLayout
        name="Dev User"
        onSignOut={() => {
          signedOut = true;
        }}
      >
        <p>Inside</p>
      </AuthenticatedLayout>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(screen.getByText('Dev User')).toBeInTheDocument();
    expect(signedOut).toBe(true);
  });
  // @feature-auth-end

  // @sample-start
  it('shows the empty state of the sample', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const api = {
      sample: {
        summary: {
          $get: async () =>
            Response.json({
              items: [],
              profile: { id: '1', displayName: 'Dev' },
            }),
        },
      },
    } as unknown as ApiClient;

    render(
      <QueryClientProvider client={client}>
        <SampleSummary api={api} />
      </QueryClientProvider>,
    );
    expect(await screen.findByText('No items yet.')).toBeInTheDocument();
  });
  // @sample-end
});
