import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const pathToTsconfig = new Map<string, any>();
const execP = promisify(exec);

export const resolveTsConfig = async (path: string, { cwd }: { cwd: string }): Promise<any> => {
  if (pathToTsconfig.has(path)) {
    return pathToTsconfig.get(path);
  }

  const tsconfig = JSON.parse(
    (
      await execP(`npx tsc --showConfig -p "${path}"`, {
        encoding: 'utf8',
        cwd,
      })
    ).stdout,
  );
  pathToTsconfig.set(path, tsconfig);
  return tsconfig;
};
