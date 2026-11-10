import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import type { Context } from 'hono';

import type { Env } from '../config/env.ts';

const transactionTtlSeconds = 600;

export function readCookie(c: Context, name: string): string | undefined {
  return getCookie(c, name);
}

export function cookieValue(
  header: string | undefined,
  name: string,
): string | undefined {
  const value = header
    ?.split(';')
    .map(part => part.trim())
    .find(part => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
  return value || undefined;
}

export function writeCookie(
  c: Context,
  env: Env,
  name: string,
  value: string,
  maxAge: number,
): void {
  setCookie(c, name, value, {
    httpOnly: true,
    secure: env.sessionCookieSecure,
    sameSite: 'Lax',
    path: '/',
    maxAge,
  });
}

export function clearCookie(c: Context, env: Env, name: string): void {
  deleteCookie(c, name, { path: '/' });
}

export const transactionMaxAgeSeconds = transactionTtlSeconds;
