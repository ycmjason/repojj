import { glob } from 'node:fs/promises';
import { join } from 'node:path/posix';

export const getSubTsconfigPaths = async ({ projectRoot }: { projectRoot: string }) => {
  const tsconfigDirents = await Array.fromAsync(
    glob(['*/**/tsconfig.json', '*/**/tsconfig.*.json'], {
      cwd: projectRoot,
      exclude: ['**/node_modules'],
      withFileTypes: true,
    }),
  );

  return tsconfigDirents
    .filter(dirent => dirent.isFile())
    .map(dirent => join(dirent.parentPath, dirent.name));
};
