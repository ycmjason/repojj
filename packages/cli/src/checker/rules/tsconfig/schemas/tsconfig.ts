import z from 'zod';

export const TsconfigWithReferencesSchema = z.object({
  references: z
    .object({
      path: z.string(),
    })
    .array(),
});

export const SubTsconfigSchema = z.union([
  TsconfigWithReferencesSchema,
  z.object({
    compilerOptions: z
      .object({
        composite: z.boolean().optional(),
        tsBuildInfoFile: z.string().optional(),
      })
      .optional(),
  }),
]);
