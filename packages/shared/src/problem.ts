import { z } from 'zod';

export const problemSchema = z.object({
  type: z.string(),
  title: z.string(),
  status: z.number().int(),
  code: z.string(),
});

export type Problem = z.infer<typeof problemSchema>;
