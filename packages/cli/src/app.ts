import { buildApplication, buildRouteMap } from '@stricli/core';
import pkg from '../package.json' with { type: 'json' };
import { checkCommand } from './commands/check/command.ts';

const routes = buildRouteMap({
  routes: {
    check: checkCommand,
  },
  docs: {
    brief: pkg.description,
  },
});

export const app = buildApplication(routes, {
  name: pkg.name,
  versionInfo: {
    currentVersion: pkg.version,
  },
});
