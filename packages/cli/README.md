# repojj

> Opinionated monorepo helpers

`repojj` is a CLI tool that helps maintain consistency and best practices in TypeScript pnpm monorepos. It enforces rules around project structure, configuration, and ensures your monorepo stays healthy.

## Installation

```bash
pnpm add -D repojj
```

## Usage

### Check for issues

Run checks to validate your monorepo structure:

```bash
npx repojj check
```

This will scan your project and report any issues with:

- Package.json configurations
- TypeScript configuration files
- Project references

### Auto-fix issues

Automatically fix issues where possible:

```bash
npx repojj check --fix
```

When using `--fix`, repojj will:

1. Automatically correct any fixable issues
2. Run the `repojj:postfix` script if it exists in your root `package.json`

## Rules

### Package.json Rules

#### `type-module`

All `package.json` files should have `"type": "module"`.

**Why?** Ensures consistent ESM module usage across your monorepo.

### TypeScript Rules

#### `root-tsconfig-project-references`

Root `tsconfig.json` should contain project references to all sub-directories containing a `tsconfig.json`.

**Why?** TypeScript's project references enable faster builds and better editor support in monorepos.

#### `sub-tsconfig-composite`

Sub-project `tsconfig.json` files should have `"composite": true`.

**Why?** Required for TypeScript project references to work correctly.

#### `sub-tsconfig-tsbuildinfo`

Sub-project `tsconfig.json` files should have `"tsBuildInfoFile"` configured.

**Why?** Ensures TypeScript build information is stored in a consistent location for incremental builds.

## Integration with Scripts

### Recommended setup

Add these scripts to your root `package.json`:

```json
{
  "scripts": {
    "check": "repojj check",
    "check:fix": "repojj check --fix",
    "repojj:postfix": "biome check --fix"
  }
}
```

The `repojj:postfix` script runs automatically after `repojj check --fix` completes. This is useful for:

- Running code formatters (e.g., Biome, Prettier)
- Running additional linters
- Organizing imports
- Any other cleanup tasks

## Requirements

- Node.js >= 24
- TypeScript ^5.0.0 (peer dependency)

## Example Output

```bash
$ pnpm exec repojj check

📋 all package.json should have "type": "module"
  ✅ LGTM!
📋 root tsconfig.json should contain all sub-directories containingaattsconfig.json
  ✅ LGTM!
📋 all sub-tsconfig.json should have composite: true
  ✅ LGTM!
📋 all sub-tsconfig.json should have tsBuildInfoFile set correctly
  ❌ Expected `compilerOptions.tsBuildInfoFile` in `packages/cli/tsconfig.json` to be set to `node_modules/.tmp/tsconfig.tsbuildinfo`

❌ Saw some issues...
```

## License

MIT

## Author

ycm.jason
