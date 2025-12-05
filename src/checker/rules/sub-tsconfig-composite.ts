import { exec } from 'node:child_process';
import { globSync } from 'node:fs';
import { join, relative } from 'node:path';
import { promisify } from 'node:util';
import z from 'zod';
import { TsconfigWithReferencesSchema } from '../../schemas/tsconfig.ts';
import { exclusifyUnion } from '../../utils/exclusifyUnion.ts';
import type { Rule } from '../checker.ts';

const execP = promisify(exec);

export const subTsconfigCompositeRule: Rule = {
  description: 'all sub-tsconfig.json should have composite: true',
  async check({ projectRoot }) {
    const tsconfigPaths = globSync(['*/**/tsconfig.json', '*/**/tsconfig.*.json'], {
      cwd: projectRoot,
      withFileTypes: true,
    })
      .filter(dirent => dirent.isFile())
      .map(dirent => join(dirent.parentPath, dirent.name));

    const errorMessages: string[] = [];

    for (const tsconfigPath of tsconfigPaths) {
      const stdout = await (async () => {
        try {
          return (
            await execP(`npx tsc --showConfig -p "${tsconfigPath}"`, {
              encoding: 'utf8',
              cwd: projectRoot,
            })
          ).stdout;
        } catch {
          return undefined;
        }
      })();

      if (stdout === undefined) {
        errorMessages.push('Unable to call tsc at project root!');
        continue;
      }

      const config = exclusifyUnion(
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
          .parse(JSON.parse(stdout)),
      );

      if (config.references) continue;

      if (config.compilerOptions?.composite !== true) {
        errorMessages.push(`${relative(projectRoot, tsconfigPath)} should have composite: true`);
      }
    }

    if (errorMessages.length > 0) {
      return { ok: false, errorMessages };
    }

    return { ok: true };
  },
};
