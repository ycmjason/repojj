import { glob } from 'node:fs/promises';
import { join, relative } from 'node:path';
import z from 'zod';
import { TsconfigWithReferencesSchema } from '../../../schemas/tsconfig.ts';
import { exclusifyUnion } from '../../../utils/exclusifyUnion.ts';
import type { Rule } from '../../checker.ts';
import { resolveTsConfig } from './utils/resolveTsConfig.ts';

export const subTsconfigCompositeRule: Rule = {
  description: 'all sub-tsconfig.json should have composite: true',
  async check({ projectRoot }) {
    const tsconfigDirents = await Array.fromAsync(
      glob(['*/**/tsconfig.json', '*/**/tsconfig.*.json'], {
        cwd: projectRoot,
        exclude: ['**/node_modules'],
        withFileTypes: true,
      }),
    );

    const tsconfigs = await Promise.all(
      tsconfigDirents
        .filter(dirent => dirent.isFile())
        .map(dirent => join(dirent.parentPath, dirent.name))
        .map(async path => ({
          path,
          tsconfig: exclusifyUnion(
            z
              .union([
                TsconfigWithReferencesSchema,
                z.object({
                  compilerOptions: z.object({ composite: z.boolean().optional() }).optional(),
                }),
              ])
              .parse(await resolveTsConfig(path, { cwd: projectRoot })),
          ),
        })),
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
