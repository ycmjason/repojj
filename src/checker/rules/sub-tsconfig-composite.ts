import { execSync } from 'node:child_process';
import { globSync } from 'node:fs';
import { join, relative } from 'node:path';
import z from 'zod';
import type { Rule } from '../checker.ts';

export const subTsconfigCompositeRule: Rule = {
  description: 'all sub-tsconfig.json should have composite: true',
  check({ projectRoot }) {
    const tsconfigPaths = globSync('*/**/tsconfig.json', { cwd: projectRoot, withFileTypes: true })
      .filter(dirent => dirent.isFile())
      .map(dirent => join(dirent.parentPath, dirent.name));

    const errorMessages: string[] = [];

    for (const tsconfigPath of tsconfigPaths) {
      const stdout = (() => {
        try {
          execSync(`npx tsc --showConfig -p "${tsconfigPath}"`, {
            encoding: 'utf8',
            cwd: projectRoot,
            stdio: ['ignore', 'pipe', 'ignore'], // Ignore stderr to avoid cluttering output on failure
          });
        } catch {
          return undefined;
        }
      })();

      if (stdout === undefined) {
        errorMessages.push('Unable to call tsc at project root!');
        continue;
      }

      const config = z
        .object({
          compilerOptions: z
            .object({
              composite: z.boolean().optional(),
            })
            .optional(),
        })
        .parse(JSON.parse(stdout));

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
