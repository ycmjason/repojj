import { glob, readFile, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { applyEdits, modify, parse } from 'jsonc-parser';
import z from 'zod';
import type { Rule } from '../../checker.ts';

type PackageJsonInfo = {
  path: string;
  content: { type?: string };
  contentRaw: string;
};

const getPackageJsonsNeedingTypeModule = async ({
  projectRoot,
}: {
  projectRoot: string;
}): Promise<PackageJsonInfo[]> => {
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
      .map(async path => {
        const contentRaw = await readFile(path, 'utf8');
        return {
          path,
          contentRaw,
          content: z.object({ type: z.string().optional() }).parse(parse(contentRaw)),
        };
      }),
  );

  return packageJsons.filter(({ content }) => content.type !== 'module');
};

export const packageJsonTypeModuleRule: Rule = {
  description: 'all package.json should have "type": "module"',
  async check({ projectRoot }) {
    const packageJsonsNeedingTypeModule = await getPackageJsonsNeedingTypeModule({ projectRoot });

    const errorMessages = packageJsonsNeedingTypeModule.map(
      ({ path }) => `${relative(projectRoot, path)} should have "type": "module"`,
    );

    if (errorMessages.length > 0) {
      return { ok: false, errorMessages };
    }

    return { ok: true };
  },

  async fix({ projectRoot }) {
    const packageJsonsNeedingTypeModule = await getPackageJsonsNeedingTypeModule({ projectRoot });

    await Promise.all(
      packageJsonsNeedingTypeModule.map(async ({ path, contentRaw }) => {
        await writeFile(
          path,
          applyEdits(contentRaw, modify(contentRaw, ['type'], 'module', {})),
          'utf8',
        );
      }),
    );
  },
};
