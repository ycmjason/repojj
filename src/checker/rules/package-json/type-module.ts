import { glob, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import z from 'zod';
import type { Rule } from '../../checker.ts';

export const packageJsonTypeModuleRule: Rule = {
  description: 'all package.json should have "type": "module"',
  async check({ projectRoot }) {
    const packageJsonDirents = await Array.fromAsync(
      glob(['**/package.json'], {
        cwd: projectRoot,
        exclude: ['**/node_modules'],
        withFileTypes: true,
      }),
    );
    const packageJsons = await Promise.all(
      packageJsonDirents
        .filter(dirent => dirent.isFile())
        .map(dirent => join(dirent.parentPath, dirent.name))
        .map(async path => ({
          path,
          content: z
            .object({ type: z.string().optional() })
            .parse(JSON.parse(await readFile(path, 'utf8'))),
        })),
    );

    const errorMessages = packageJsons.flatMap(({ path, content }) => {
      if (content.type !== 'module') {
        return [`${relative(projectRoot, path)} should have "type": "module"`];
      }
      return [];
    });

    if (errorMessages.length > 0) {
      return { ok: false, errorMessages };
    }

    return { ok: true };
  },
};
