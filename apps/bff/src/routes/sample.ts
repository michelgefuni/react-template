// @sample-file
import { errorCodes, problem } from '@react-template/shared';
import type { Context } from 'hono';

import {
  accessTokenFor,
  createTypedClient,
  UpstreamTimeoutError,
} from '../clients/upstream.ts';
import type { paths as CatalogPaths } from '../clients/generated/catalog.ts';
import type { paths as ProfilePaths } from '../clients/generated/profile.ts';
import type { AppBindings, AppDependencies } from '../dependencies.ts';

export function sampleSummary(c: Context<AppBindings>, deps: AppDependencies) {
  const catalog = deps.upstreams.find(item => item.name === 'catalog');
  const profile = deps.upstreams.find(item => item.name === 'profile');
  if (!catalog || !profile) {
    return c.json(problem(502, errorCodes.upstreamError), 502);
  }

  const userToken = c.get('session')?.accessToken;
  return loadSummary(c, deps, catalog, profile, userToken);
}

async function loadSummary(
  c: Context<AppBindings>,
  deps: AppDependencies,
  catalog: AppDependencies['upstreams'][number],
  profile: AppDependencies['upstreams'][number],
  userToken: string | undefined,
) {
  try {
    const catalogClient = createTypedClient<CatalogPaths>(catalog, () =>
      accessTokenFor(catalog, userToken),
    );
    const profileClient = createTypedClient<ProfilePaths>(profile, () =>
      accessTokenFor(profile, userToken),
    );
    const [items, me] = await Promise.all([
      catalogClient.GET('/items'),
      profileClient.GET('/me'),
    ]);
    if (!items.data || !me.data) {
      return c.json(problem(502, errorCodes.upstreamError), 502);
    }
    return c.json({ items: items.data, profile: me.data });
  } catch (error) {
    if (error instanceof UpstreamTimeoutError) {
      return c.json(problem(504, errorCodes.upstreamTimeout), 504);
    }
    deps.logger.error({ event: 'upstream_failed' }, 'sample upstream failed');
    throw error;
  }
}
