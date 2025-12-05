import { readFile, writeFile } from 'node:fs/promises';
import { relative } from 'node:path';
import { applyEdits, modify } from 'jsonc-parser';
import { exclusifyUnion } from '../../../utils/exclusifyUnion.ts';
import type { Rule } from '../../checker.ts';
import { SubTsconfigSchema } from './schemas/tsconfig.ts';
import { getSubTsconfigPaths } from './utils/getSubTsconfigPaths.ts';
import { resolveTsConfig } from './utils/resolveTsConfig.ts';

type TsconfigInfo = {
  path: string;
  tsconfig: ReturnType<typeof exclusifyUnion<ReturnType<(typeof SubTsconfigSchema)['parse']>>>;
};

const getTsconfigsNeedingComposite = async ({
  projectRoot,
}: {
  projectRoot: string;
}): Promise<TsconfigInfo[]> => {
  const tsconfigs = await Promise.all(
    (await getSubTsconfigPaths({ projectRoot })).map(async path => ({
      path,
      tsconfig: exclusifyUnion(
        SubTsconfigSchema.parse(await resolveTsConfig(path, { cwd: projectRoot })),
      ),
    })),
  );

  return tsconfigs.filter(({ tsconfig }) => {
    if (tsconfig === undefined || tsconfig.references) return false;
    return tsconfig.compilerOptions?.composite !== true;
  });
};

export const subTsconfigCompositeRule: Rule = {
  description: 'all sub-tsconfig.json should have composite: true',
  async check({ projectRoot }) {
    const tsconfigsNeedingComposite = await getTsconfigsNeedingComposite({ projectRoot });

    const errorMessages = tsconfigsNeedingComposite.map(
      ({ path }) => `${relative(projectRoot, path)} should have composite: true`,
    );

    if (errorMessages.length > 0) {
      return { ok: false, errorMessages };
    }

    return { ok: true };
  },

  async fix({ projectRoot }) {
    const tsconfigsNeedingComposite = await getTsconfigsNeedingComposite({ projectRoot });

    await Promise.all(
      tsconfigsNeedingComposite.map(async ({ path }) => {
        const tsconfigString = await readFile(path, 'utf8');
        const edits = modify(tsconfigString, ['compilerOptions', 'composite'], true, {});

        await writeFile(path, applyEdits(tsconfigString, edits), 'utf8');
      }),
    );
  },
};
