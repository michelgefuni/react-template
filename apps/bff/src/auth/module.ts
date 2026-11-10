import { errorCodes, problem } from '@react-template/shared';
import type { Context, MiddlewareHandler } from 'hono';
import { z } from 'zod';

import type { AppBindings, AppDependencies } from '../dependencies.ts';
import {
  clearCookie,
  readCookie,
  transactionMaxAgeSeconds,
  writeCookie,
} from './cookies.ts';
import { decryptJson, encryptJson, signValue, verifyValue } from './crypto.ts';
import type { AuthTransaction, IssuedTokens } from './identity-provider.ts';
import { sanitizeReturnTo } from './return-to.ts';
import { newSessionId, type Session } from './session-store.ts';

const loginQuerySchema = z.object({
  returnTo: z.string().optional(),
});

const transactionSchema = z.object({
  state: z.string(),
  nonce: z.string(),
  codeVerifier: z.string(),
  returnTo: z.string(),
});

const csrfHeader = 'x-csrf-token';

export function rejectWithoutCsrfHeader(
  deps: AppDependencies,
): MiddlewareHandler<AppBindings> {
  return async (c, next) => {
    if (
      c.req.method === 'GET' ||
      c.req.method === 'HEAD' ||
      c.req.method === 'OPTIONS'
    ) {
      return next();
    }
    if (c.req.header(csrfHeader) !== '1') {
      deps.logger.warn(
        { event: 'csrf_rejected', requestId: c.get('requestId') },
        'csrf rejected',
      );
      return c.json(problem(403, errorCodes.forbidden), 403);
    }
    return next();
  };
}

export function loadSessionMiddleware(
  deps: AppDependencies,
): MiddlewareHandler<AppBindings> {
  return async (c, next) => {
    c.set('session', await loadSession(c, deps));
    return next();
  };
}

export const requireSession: MiddlewareHandler<AppBindings> = async (
  c,
  next,
) => {
  if (!c.get('session'))
    return c.json(problem(401, errorCodes.unauthorized), 401);
  return next();
};

export function loginHandler(
  deps: AppDependencies,
): MiddlewareHandler<AppBindings> {
  return async c => {
    const parsed = loginQuerySchema.safeParse(c.req.query());
    if (!parsed.success)
      return c.json(problem(400, errorCodes.badRequest), 400);
    const returnTo = sanitizeReturnTo(parsed.data.returnTo);
    const { transaction, authorizationUrl } =
      await deps.identity.createTransaction(returnTo);
    writeCookie(
      c,
      deps.env,
      deps.env.transactionCookieName,
      encryptJson(transaction, deps.env.encryptionKey),
      transactionMaxAgeSeconds,
    );
    return c.redirect(authorizationUrl.toString());
  };
}

export function callbackHandler(
  deps: AppDependencies,
): MiddlewareHandler<AppBindings> {
  return async c => {
    const transaction = readTransaction(c, deps);
    if (!transaction) return c.json(problem(400, errorCodes.badRequest), 400);
    const currentUrl = new URL(deps.env.OIDC_REDIRECT_URI);
    currentUrl.search = new URL(c.req.url).search;
    let tokens: IssuedTokens;
    try {
      tokens = await deps.identity.exchange(currentUrl, transaction);
    } catch {
      deps.logger.warn(
        { event: 'login_failed', requestId: c.get('requestId') },
        'login failed',
      );
      return c.json(problem(400, errorCodes.badRequest), 400);
    }
    clearCookie(c, deps.env, deps.env.transactionCookieName);
    const session = createSession(deps, tokens);
    await deps.sessions.save(session);
    writeCookie(
      c,
      deps.env,
      deps.env.sessionCookieName,
      signValue(session.id, deps.env.SESSION_SECRET),
      deps.env.SESSION_ABSOLUTE_TTL_SECONDS,
    );
    deps.logger.info(
      { event: 'login_succeeded', sub: session.sub },
      'login succeeded',
    );
    return c.redirect(transaction.returnTo);
  };
}

export function logoutHandler(
  deps: AppDependencies,
): MiddlewareHandler<AppBindings> {
  return async c => {
    const session = c.get('session');
    if (session) await deps.sessions.delete(session.id);
    clearCookie(c, deps.env, deps.env.sessionCookieName);
    deps.logger.info({ event: 'logout', sub: session?.sub ?? '' }, 'logout');
    return c.json({
      logoutUrl: session
        ? deps.identity.logoutUrl(session.idToken)
        : deps.env.OIDC_POST_LOGOUT_REDIRECT_URI,
    });
  };
}

export function currentUser(c: Context<AppBindings>) {
  const session = c.get('session');
  if (!session) return c.json(problem(401, errorCodes.unauthorized), 401);
  return c.json({ id: session.sub, name: session.name, email: session.email });
}

async function loadSession(
  c: Context<AppBindings>,
  deps: AppDependencies,
): Promise<Session | null> {
  const signed = readCookie(c, deps.env.sessionCookieName);
  if (!signed) return null;
  const id = verifyValue(signed, deps.env.SESSION_SECRET);
  if (!id) return null;
  const current = await deps.sessions.read(id);
  if (!current) return null;
  const now = Date.now();
  if (current.absoluteExpiresAt <= now || current.idleExpiresAt <= now) {
    await deps.sessions.delete(id);
    return null;
  }

  let session = current;
  const refreshAt =
    current.accessTokenExpiresAt - deps.env.TOKEN_REFRESH_SKEW_SECONDS * 1000;
  if (refreshAt <= now) {
    session = await refreshSession(deps, current);
  }

  const slid = {
    ...session,
    idleExpiresAt: Date.now() + deps.env.SESSION_IDLE_TTL_SECONDS * 1000,
  };
  await deps.sessions.save(slid);
  return slid;
}

async function refreshSession(
  deps: AppDependencies,
  current: Session,
): Promise<Session> {
  const lockKey = `refresh:${current.id}`;
  const locked = await deps.sessions.acquireLock(lockKey, 5000);
  if (!locked) {
    await new Promise(resolve => setTimeout(resolve, 50));
    return (await deps.sessions.read(current.id)) ?? current;
  }
  try {
    const latest = (await deps.sessions.read(current.id)) ?? current;
    const refreshAt =
      latest.accessTokenExpiresAt - deps.env.TOKEN_REFRESH_SKEW_SECONDS * 1000;
    if (refreshAt > Date.now()) return latest;
    const tokens = await deps.identity.refresh(latest.refreshToken);
    const updated = applyTokens(latest, tokens);
    await deps.sessions.save(updated);
    return updated;
  } catch {
    deps.logger.warn(
      { event: 'refresh_failed', sub: current.sub },
      'token refresh failed',
    );
    return current;
  } finally {
    await deps.sessions.releaseLock(lockKey);
  }
}

function createSession(deps: AppDependencies, tokens: IssuedTokens): Session {
  const now = Date.now();
  return applyTokens(
    {
      id: newSessionId(),
      sub: tokens.sub,
      name: tokens.name,
      email: tokens.email,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      idToken: tokens.idToken,
      accessTokenExpiresAt: now,
      createdAt: now,
      idleExpiresAt: now + deps.env.SESSION_IDLE_TTL_SECONDS * 1000,
      absoluteExpiresAt: now + deps.env.SESSION_ABSOLUTE_TTL_SECONDS * 1000,
    },
    tokens,
  );
}

function applyTokens(session: Session, tokens: IssuedTokens): Session {
  return {
    ...session,
    sub: tokens.sub,
    name: tokens.name,
    email: tokens.email,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    idToken: tokens.idToken,
    accessTokenExpiresAt: Date.now() + tokens.expiresInSeconds * 1000,
  };
}

function readTransaction(
  c: Context<AppBindings>,
  deps: AppDependencies,
): AuthTransaction | null {
  const raw = readCookie(c, deps.env.transactionCookieName);
  if (!raw) return null;
  const parsed = transactionSchema.safeParse(
    decryptJson(raw, deps.env.encryptionKey),
  );
  return parsed.success ? parsed.data : null;
}
