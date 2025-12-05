import { globSync, readFileSync, writeFileSync } from 'node:fs';
import { join, normalize, relative } from 'node:path';
import { applyEdits, modify, parse } from 'jsonc-parser';
import { TsconfigWithReferencesSchema } from '../../../schemas/tsconfig.ts';
import type { Rule } from '../../checker.ts';

const getExpectedReferencePaths = ({ projectRoot }: { projectRoot: string }) => {
  return globSync('*/**/tsconfig.json', { cwd: projectRoot, withFileTypes: true })
    .filter(dirent => dirent.isFile())
    .map(dirent => normalize(relative(projectRoot, dirent.parentPath)));
};

export const rootTsconfigProjectReferencesRule: Rule = {
  description: 'root tsconfig.json should contain all sub-directories containing a tsconfig.json',
  check({ projectRoot }) {
    const rootTsConfigPath = join(projectRoot, 'tsconfig.json');

    const expectedReferencePaths = new Set(getExpectedReferencePaths({ projectRoot }));

    const actualPaths = new Set(
      TsconfigWithReferencesSchema.parse(
        parse(readFileSync(rootTsConfigPath, 'utf8')),
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

  fix({ projectRoot }) {
    const rootTsConfigPath = join(projectRoot, 'tsconfig.json');
    const expectedReferencePaths = new Set(getExpectedReferencePaths({ projectRoot }));
    const rootTsConfigString = readFileSync(rootTsConfigPath, 'utf8');
    writeFileSync(
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
