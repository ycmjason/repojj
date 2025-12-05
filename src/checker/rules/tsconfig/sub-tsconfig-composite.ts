import { globSync } from 'node:fs';
import { join, relative } from 'node:path';
import z from 'zod';
import { TsconfigWithReferencesSchema } from '../../../schemas/tsconfig.ts';
import { exclusifyUnion } from '../../../utils/exclusifyUnion.ts';
import type { Rule } from '../../checker.ts';
import { resolveTsConfig } from './utils/resolveTsConfig.ts';

export const subTsconfigCompositeRule: Rule = {
  description: 'all sub-tsconfig.json should have composite: true',
  async check({ projectRoot }) {
    const tsconfigPaths = globSync(['*/**/tsconfig.json', '*/**/tsconfig.*.json'], {
      cwd: projectRoot,
      withFileTypes: true,
    })
      .filter(dirent => dirent.isFile())
      .map(dirent => join(dirent.parentPath, dirent.name));

    const tsconfigs = await Promise.all(
      tsconfigPaths.map(async path => {
        return await (async () => {
          try {
            return {
              path,
              tsconfig: exclusifyUnion(
                z
                  .union([
                    TsconfigWithReferencesSchema,
                    z.object({
                      compilerOptions: z
                        .object({
                          composite: z.boolean().optional(),
                        })
                        .optional(),
                    }),
                  ])
                  .parse(await resolveTsConfig(path, { cwd: projectRoot })),
              ),
            };
          } catch {
            return { path, tsconfig: undefined };
          }
        })();
      }),
    );

    const errorMessages = tsconfigs.flatMap(({ path, tsconfig }) => {
      if (tsconfig === undefined) {
        return [`Unable to resolve tsconfig for ${relative(projectRoot, path)}`];
      }

      if (tsconfig.references) return [];

      if (tsconfig.compilerOptions?.composite !== true) {
        return [`${relative(projectRoot, path)} should have composite: true`];
      }

      return [];
    });

    if (errorMessages.length > 0) {
      return { ok: false, errorMessages };
    }

    return { ok: true };
  },
};
