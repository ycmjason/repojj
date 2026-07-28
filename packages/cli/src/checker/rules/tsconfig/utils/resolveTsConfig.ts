import { parseTsconfig, type TsConfigJsonResolved } from 'get-tsconfig';

const pathToTsconfig = new Map<string, TsConfigJsonResolved>();

/**
 * Read a tsconfig with its `extends` chain applied.
 *
 * Deliberately NOT the TypeScript compiler API: the rules here only read `references`,
 * `compilerOptions.composite` and `compilerOptions.tsBuildInfoFile`, which is a config-file
 * question, not a type-checking one. TypeScript 7 (the Go port) dropped the JS compiler API
 * entirely — `ts.sys` is gone — so depending on it capped repojj at TS6 for no benefit. Dropping
 * the peer dependency means repojj no longer cares which TypeScript, if any, the repo installs.
 */
export const resolveTsConfig = (configPath: string): TsConfigJsonResolved => {
  const cached = pathToTsconfig.get(configPath);
  if (cached !== undefined) return cached;

  const tsconfig = parseTsconfig(configPath);

  pathToTsconfig.set(configPath, tsconfig);
  return tsconfig;
};
