import { buildCommand } from '@stricli/core';

export const checkCommand = buildCommand({
  loader: async () => import('./impl.ts'),
  parameters: {
    flags: {
      fix: {
        brief: 'automatically fix issues where possible',
        kind: 'boolean',
      },
    },
  },
  docs: {
    brief: 'Run all checks',
    fullDescription: `Perform checks`,
  },
});
