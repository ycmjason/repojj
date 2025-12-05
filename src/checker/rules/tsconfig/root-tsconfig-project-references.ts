import { glob, readFile, writeFile } from 'node:fs/promises';
import { join, normalize, relative } from 'node:path';
import { applyEdits, modify, parse } from 'jsonc-parser';
import { TsconfigWithReferencesSchema } from '../../../schemas/tsconfig.ts';
import type { Rule } from '../../checker.ts';

const getExpectedReferencePaths = async ({ projectRoot }: { projectRoot: string }) => {
  return (
    await Array.fromAsync(
      glob('*/**/tsconfig.json', {
        cwd: projectRoot,
        exclude: ['**/node_modules'],
        withFileTypes: true,
      }),
    )
  )
    .filter(dirent => dirent.isFile())
    .map(dirent => normalize(relative(projectRoot, dirent.parentPath)));
};

export const rootTsconfigProjectReferencesRule: Rule = {
  description: 'root tsconfig.json should contain all sub-directories containing a tsconfig.json',
  async check({ projectRoot }) {
    const rootTsConfigPath = join(projectRoot, 'tsconfig.json');

    const expectedReferencePaths = new Set(await getExpectedReferencePaths({ projectRoot }));

    const actualPaths = new Set(
      TsconfigWithReferencesSchema.parse(
        parse(await readFile(rootTsConfigPath, 'utf8')),
      ).references.map(({ path }) => normalize(path)),
    );

    if (actualPaths.symmetricDifference(expectedReferencePaths).size === 0) {
      return { ok: true };
    }

    const missingPaths = expectedReferencePaths.difference(actualPaths);
    const unexpectedPaths = actualPaths.difference(expectedReferencePaths);

    return {
      ok: false,
      errorMessages: [
        ...missingPaths.values().map(missingPath => `Cannot find ${missingPath}`),
        ...unexpectedPaths.values().map(unexpectedPath => `Unexpected ${unexpectedPath}`),
      ],
    };
  },

  async fix({ projectRoot }) {
    const rootTsConfigPath = join(projectRoot, 'tsconfig.json');
    const expectedReferencePaths = new Set(await getExpectedReferencePaths({ projectRoot }));
    const rootTsConfigString = await readFile(rootTsConfigPath, 'utf8');
    await writeFile(
      rootTsConfigPath,
      applyEdits(
        rootTsConfigString,
        modify(
          rootTsConfigString,
          ['references'],
          expectedReferencePaths
            .values()
            .map(path => ({ path }))
            .toArray(),
          {},
        ),
      ),
      'utf8',
    );
  },
};
