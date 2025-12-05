import { packageJsonTypeModuleRule } from '../../checker/rules/package-json/type-module.ts';
import { rootTsconfigProjectReferencesRule } from '../../checker/rules/tsconfig/root-tsconfig-project-references.ts';
import { subTsconfigCompositeRule } from '../../checker/rules/tsconfig/sub-tsconfig-composite.ts';
import { subTsconfigTsBuildInfoRule } from '../../checker/rules/tsconfig/sub-tsconfig-tsbuildinfo.ts';

export const RULES = [
  packageJsonTypeModuleRule,
  rootTsconfigProjectReferencesRule,
  subTsconfigCompositeRule,
  subTsconfigTsBuildInfoRule,
];
