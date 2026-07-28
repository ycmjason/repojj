import { readFileSync } from 'node:fs';
import { parseTsconfig, type TsConfigJsonResolved } from 'get-tsconfig';
import { type ParseError, parse, printParseErrorCode } from 'jsonc-parser';

const cache = new Map<string, TsConfigJsonResolved>();

/**
 * The config's OWN contents, with syntax errors surfaced.
 *
 * `parseTsconfig` swallows JSONC parse errors and best-effort recovers, so a tsconfig with a
 * stray comma — or an unresolved merge conflict — silently parses as whichever half survived,
 * and the rules then report a confusing field violation instead of "this file is broken".
 * Parsing it ourselves first turns that back into a loud failure.
 */
const readOwn = (configPath: string): TsConfigJsonResolved => {
  const errors: ParseError[] = [];
  const json: unknown = parse(readFileSync(configPath, 'utf8'), errors, {
    allowTrailingComma: true,
  });

  const [firstError] = errors;
  if (firstError !== undefined) {
    throw new Error(
      `${configPath} is not valid JSONC: ${printParseErrorCode(firstError.error)} at offset ${firstError.offset}`,
    );
  }

  return (json ?? {}) as TsConfigJsonResolved;
};

/**
 * Read a tsconfig for the three fields these rules judge — each from the source that makes the
 * rule mean what it says.
 *
 * Deliberately NOT the TypeScript compiler API: this is a config-file question, not a
 * type-checking one, and TypeScript 7 (the Go port) dropped the JS compiler API entirely —
 * `ts.sys` is gone — so depending on it capped repojj at TS6 for no benefit.
 *
 * - `composite` comes from the RESOLVED config: inheriting it from a shared base is normal and
 *   TypeScript honours it, so a package that extends a `composite: true` base genuinely is composite.
 * - `tsBuildInfoFile` comes from the config's OWN file. An inherited literal path is resolved by
 *   TypeScript against the file that DECLARED it, so a shared base handing the same relative path
 *   to every package points them all at one buildinfo that they then mutually clobber — exactly
 *   what this rule exists to catch. Treating inherited as unset flags it.
 *   (Caveat: a base using `"${configDir}/..."` resolves per-consuming-config and is therefore
 *   legitimate, but is reported as unset. Nothing uses that form yet; revisit if it appears.)
 * - `references` comes from the OWN file because TypeScript does not inherit it through `extends`.
 */
export const resolveTsConfig = (configPath: string): TsConfigJsonResolved => {
  const cached = cache.get(configPath);
  if (cached !== undefined) return cached;

  const own = readOwn(configPath);
  const resolved = parseTsconfig(configPath);

  const tsconfig: TsConfigJsonResolved = {
    references: own.references,
    compilerOptions: {
      composite: resolved.compilerOptions?.composite,
      tsBuildInfoFile: own.compilerOptions?.tsBuildInfoFile,
    },
  };

  cache.set(configPath, tsconfig);
  return tsconfig;
};
