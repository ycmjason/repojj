import z from 'zod';

export const TsconfigWithReferencesSchema = z.object({
  // `.nonempty()` is load-bearing: this branch is what marks a tsconfig as a solution file the
  // per-package rules should skip. A literal `"references": []` is not a solution file — it's a
  // leaf that still needs `composite` and its own `tsBuildInfoFile` — so it must fall through to
  // the branch below rather than silently exempting itself from every rule.
  references: z
    .object({
      path: z.string(),
    })
    .array()
    .nonempty(),
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
