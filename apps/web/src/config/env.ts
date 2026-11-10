import { z } from 'zod';

const schema = z.object({
  VITE_API_BASE_PATH: z.string().startsWith('/').default('/api'),
  VITE_API_BASE_URL: z.string().default(''),
  VITE_QUERY_STALE_TIME_MS: z.coerce.number().positive().default(30_000),
});

export const env = schema.parse({
  VITE_API_BASE_PATH: import.meta.env.VITE_API_BASE_PATH,
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  VITE_QUERY_STALE_TIME_MS: import.meta.env.VITE_QUERY_STALE_TIME_MS,
});

export type WebEnv = z.infer<typeof schema>;
