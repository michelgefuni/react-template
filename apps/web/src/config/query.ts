import { env } from './env';

export const queryConfig = {
  staleTimeMs: env.VITE_QUERY_STALE_TIME_MS,
};
