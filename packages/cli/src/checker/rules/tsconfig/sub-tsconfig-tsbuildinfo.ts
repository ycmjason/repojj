import { readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, relative, resolve } from 'node:path';
import { applyEdits, modify } from 'jsonc-parser';
import { exclusifyUnion } from '../../../utils/exclusifyUnion.ts';
import type { Rule } from '../../checker.ts';
import { SubTsconfigSchema } from './schemas/tsconfig.ts';
import { getSubTsconfigPaths } from './utils/getSubTsconfigPaths.ts';
import { resolveTsConfig } from './utils/resolveTsConfig.ts';

const getExpectedTsBuildInfoPath = (tsconfigPath: string) =>
  `node_modules/.tmp/${basename(tsconfigPath, '.json')}.tsbuildinfo`;

export const subTsconfigTsBuildInfoRule: Rule = {
  description: 'all sub-tsconfig.json should have tsBuildInfoFile set correctly',
  async check({ projectRoot }) {
    const tsconfigPaths = await getSubTsconfigPaths({ projectRoot });

    const tsconfigs = await Promise.all(
      tsconfigPaths.map(async path => ({
        path,
        tsconfig: exclusifyUnion(
          SubTsconfigSchema.parse(await resolveTsConfig(path, { cwd: projectRoot })),
        ),
      })),
    );

    const errorMessages = tsconfigs.flatMap(({ path, tsconfig }) => {
      if (tsconfig === undefined) {
        return [`Unable to resolve tsconfig for ${relative(projectRoot, path)}`];
      }

      if (tsconfig.references) return [];

      const expectedRelativePath = getExpectedTsBuildInfoPath(path);

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

  async fix({ projectRoot }) {
    const tsconfigPaths = await getSubTsconfigPaths({ projectRoot });

    await Promise.all(
      tsconfigPaths.map(async path => {
        const tsconfig = exclusifyUnion(
          SubTsconfigSchema.parse(await resolveTsConfig(path, { cwd: projectRoot })),
        );

        // Skip root tsconfigs (those with references)
        if (tsconfig === undefined || tsconfig.references) return;

        const expectedRelativePath = getExpectedTsBuildInfoPath(path);

        const tsconfigString = await readFile(path, 'utf8');
        const edits = modify(
          tsconfigString,
          ['compilerOptions', 'tsBuildInfoFile'],
          expectedRelativePath,
          {},
        );

        await writeFile(path, applyEdits(tsconfigString, edits), 'utf8');
      }),
    );
  },
};
