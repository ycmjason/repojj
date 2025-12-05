import path from 'node:path';
import ts from 'typescript';

const pathToTsconfig = new Map<string, any>();

export const resolveTsConfig = async (
  configPath: string,
  { cwd }: { cwd: string },
): Promise<any> => {
  if (pathToTsconfig.has(configPath)) {
    return pathToTsconfig.get(configPath);
  }

  const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
  if (configFile.error) {
    throw new Error(
      ts.formatDiagnostics([configFile.error], {
        getCanonicalFileName: f => f,
        getCurrentDirectory: () => cwd,
        getNewLine: () => '\n',
      }),
    );
  }

  const parsedConfig = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    path.dirname(configPath),
  );

  if (parsedConfig.errors.length > 0) {
    throw new Error(
      ts.formatDiagnostics(parsedConfig.errors, {
        getCanonicalFileName: f => f,
        getCurrentDirectory: () => cwd,
        getNewLine: () => '\n',
      }),
    );
  }

  const result = {
    compilerOptions: parsedConfig.options,
    references: parsedConfig.projectReferences,
  };

  pathToTsconfig.set(configPath, result);
  return result;
};
