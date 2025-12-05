import { glob } from 'node:fs/promises';
import { basename, dirname, join, relative, resolve } from 'node:path';
import z from 'zod';
import { TsconfigWithReferencesSchema } from '../../../schemas/tsconfig.ts';
import { exclusifyUnion } from '../../../utils/exclusifyUnion.ts';
import type { Rule } from '../../checker.ts';
import { resolveTsConfig } from './utils/resolveTsConfig.ts';

export const subTsconfigTsBuildInfoRule: Rule = {
  description: 'all sub-tsconfig.json should have tsBuildInfoFile set correctly',
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
                  compilerOptions: z.object({ tsBuildInfoFile: z.string().optional() }).optional(),
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

      const expectedRelativePath = `node_modules/.tmp/${basename(path, '.json')}.tsbuildinfo`;

      const actualTsBuildInfoFile = tsconfig.compilerOptions?.tsBuildInfoFile;

      if (!actualTsBuildInfoFile) {
        return [
          `Expected \`compilerOptions.tsBuildInfoFile\` in \`${relative(projectRoot, path)}\` to be set to \`${expectedRelativePath}\``,
        ];
      }

      if (
        resolve(dirname(path), actualTsBuildInfoFile) !==
        resolve(dirname(path), expectedRelativePath)
      ) {
        return [
          `Expected \`compilerOptions.tsBuildInfoFile\` in \`${relative(projectRoot, path)}\` to be \`${expectedRelativePath}\`, but got \`${actualTsBuildInfoFile}\``,
        ];
      }

      return [];
    });

    if (errorMessages.length > 0) {
      return { ok: false, errorMessages };
    }

    return { ok: true };
  },
};
