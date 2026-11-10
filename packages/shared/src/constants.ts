export const apiBasePath = '/api' as const;

export const csrfHeaderName = 'x-csrf-token' as const;

export const csrfHeaderValue = '1' as const;

export const errorCodes = {
  badRequest: 'bad_request',
  unauthorized: 'unauthorized',
  forbidden: 'forbidden',
  rateLimited: 'rate_limited',
  csrfRejected: 'csrf_rejected',
  notFound: 'not_found',
  upstreamTimeout: 'upstream_timeout',
  upstreamFailed: 'upstream_failed',
  internal: 'internal',
} as const;

export type ErrorCode = (typeof errorCodes)[keyof typeof errorCodes];

export const errorTitles: Record<ErrorCode, string> = {
  bad_request: 'Bad request',
  unauthorized: 'Sign-in is required.',
  forbidden: 'Forbidden',
  rate_limited: 'Too many requests',
  csrf_rejected: 'Request rejected',
  not_found: 'Not found',
  upstream_timeout: 'Upstream timeout',
  upstream_failed: 'Upstream request failed',
  internal: 'Internal error',
};
