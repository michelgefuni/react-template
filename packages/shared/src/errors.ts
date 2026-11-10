import { z } from 'zod';

export const errorCodes = {
  badRequest: 'bad_request',
  unauthorized: 'unauthorized',
  forbidden: 'forbidden',
  notFound: 'not_found',
  payloadTooLarge: 'payload_too_large',
  rateLimited: 'rate_limited',
  upstreamTimeout: 'upstream_timeout',
  upstreamError: 'upstream_error',
  internal: 'internal_error',
} as const;

export type ErrorCode = (typeof errorCodes)[keyof typeof errorCodes];

export const errorMessages: Record<ErrorCode, string> = {
  bad_request: 'The request is invalid.',
  unauthorized: 'Sign-in is required.',
  forbidden: 'The request was rejected.',
  not_found: 'The resource was not found.',
  payload_too_large: 'The request body is too large.',
  rate_limited: 'Too many requests.',
  upstream_timeout: 'The upstream service timed out.',
  upstream_error: 'The upstream service failed.',
  internal_error: 'An unexpected error occurred.',
};

export const problemType = 'about:blank';

export const errorResponseSchema = z.object({
  type: z.string(),
  title: z.string(),
  status: z.number().int(),
  detail: z.string(),
  code: z.string(),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;

export function problem(
  status: number,
  code: ErrorCode,
  detail?: string,
): ErrorResponse {
  return {
    type: problemType,
    title: errorMessages[code],
    status,
    detail: detail ?? errorMessages[code],
    code,
  };
}
