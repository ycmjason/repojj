import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { cwd } from 'node:process';

export const findProjectRoot = (dir = cwd(), { maxDepth = 10 } = {}): string | undefined => {
  if (maxDepth <= 0) {
    return undefined;
  }

  if (existsSync(join(dir, 'package.json'))) {
    return dir;
  }

  return findProjectRoot(join(dir, '..'), { maxDepth: maxDepth - 1 });
};
