import { Hono } from 'hono';

import { createCoreApp } from './core/app.ts';
import type { AppDependencies } from './dependencies.ts';
// @feature-auth-start
import { csrf } from 'hono/csrf';

import {
  callbackHandler,
  currentUser,
  loadSessionMiddleware,
  loginHandler,
  logoutHandler,
  rejectWithoutCsrfHeader,
  requireSession,
} from './auth/module.ts';
// @feature-auth-end
// @sample-start
import { sampleSummary } from './routes/sample.ts';
// @sample-end

export function createApp(deps: AppDependencies) {
  return new Hono().route(deps.env.API_BASE_PATH, createRoutes(deps));
}

// prettier-ignore
export function createRoutes(deps: AppDependencies) {
  const routes = createCoreApp(deps)
    // @feature-auth-start
    .use('*', csrf())
    .use('*', rejectWithoutCsrfHeader(deps))
    .use('*', loadSessionMiddleware(deps))
    .get('/auth/login', loginHandler(deps))
    .get('/auth/callback', callbackHandler(deps))
    .post('/auth/logout', logoutHandler(deps))
    .get('/auth/me', currentUser)
    .use('*', requireSession)
    // @feature-auth-end
    // @sample-start
    .get('/sample/summary', c => sampleSummary(c, deps))
    // @sample-end
    ;
  return routes;
}

export type AppType = ReturnType<typeof createRoutes>;
