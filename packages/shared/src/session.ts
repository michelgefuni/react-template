import { z } from 'zod';

export const sessionUserSchema = z.object({
  subject: z.string(),
  name: z.string(),
  email: z.string(),
});

export type SessionUser = z.infer<typeof sessionUserSchema>;

export const logoutResponseSchema = z.object({
  logoutUrl: z.string().nullable(),
});

export type LogoutResponse = z.infer<typeof logoutResponseSchema>;
