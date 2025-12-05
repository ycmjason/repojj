import z from 'zod';

export const TsconfigWithReferencesSchema = z.object({
  references: z
    .object({
      path: z.string(),
    })
    .array(),
});
