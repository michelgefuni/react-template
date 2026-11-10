import { errorCodes, problem, type ErrorCode } from '@react-template/shared';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { secureHeaders } from 'hono/secure-headers';
import { rateLimiter } from 'hono-rate-limiter';

import { randomId } from './random-id.ts';
import type { AppBindings, AppDependencies } from '../dependencies.ts';

export function createCoreApp(deps: AppDependencies) {
  const limiter = rateLimiter({
    windowMs: deps.env.RATE_LIMIT_WINDOW_MS,
    limit: deps.env.RATE_LIMIT_MAX,
    standardHeaders: 'draft-6',
    ...(deps.rateLimitStore ? { store: deps.rateLimitStore } : {}),
    keyGenerator: c =>
      deps.clientKey?.(c.req.header('cookie')) ??
      clientAddress(c, deps.env.trustProxy),
    handler: c => {
      deps.logger.warn({ event: 'rate_limited' }, 'rate limit');
      return c.json(problem(429, errorCodes.rateLimited), 429);
    },
  });

  return new Hono<AppBindings>()
    .use('*', async (c, next) => {
      const requestId = c.req.header('x-request-id') ?? randomId();
      c.set('requestId', requestId);
      c.header('x-request-id', requestId);
      return next();
    })
    .use('*', secureHeaders())
    .use('*', async (c, next) => {
      if (deps.env.corsAllowedOrigins.length === 0) return next();
      return cors({ origin: deps.env.corsAllowedOrigins, credentials: true })(
        c,
        next,
      );
    })
    .use(
      '*',
      bodyLimit({
        maxSize: deps.env.BODY_LIMIT_BYTES,
        onError: c => c.json(problem(413, errorCodes.payloadTooLarge), 413),
      }),
    )
    .use('*', limiter)
    .onError((error, c) => {
      if (error instanceof HTTPException) {
        return c.json(
          problem(error.status, codeForStatus(error.status)),
          error.status,
        );
      }
      deps.logger.error(
        { event: 'unhandled', requestId: c.get('requestId') },
        'request failed',
      );
      return c.json(problem(500, errorCodes.internal), 500);
    })
    .notFound(c => c.json(problem(404, errorCodes.notFound), 404))
    .get('/health', c => c.json({ status: 'ok' as const }))
    .get('/ready', async c => {
      for (const check of deps.readiness ?? []) {
        if (!(await check()))
          return c.json(problem(503, errorCodes.internal), 503);
      }
      return c.json({ status: 'ready' as const });
    });
}

function clientAddress(
  c: { req: { header: (name: string) => string | undefined } },
  trustProxy: boolean,
): string {
  if (!trustProxy) return 'local';
  return c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
}

function codeForStatus(status: number): ErrorCode {
  if (status === 401) return errorCodes.unauthorized;
  if (status === 403) return errorCodes.forbidden;
  if (status === 404) return errorCodes.notFound;
  if (status === 413) return errorCodes.payloadTooLarge;
  if (status === 429) return errorCodes.rateLimited;
  return errorCodes.badRequest;
}
