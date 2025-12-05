import { buildCommand } from '@stricli/core';
import { formatAsBullet } from '../../utils/formatAsBullet.ts';
import { RULES } from './RULES.ts';

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
    fullDescription: `Perform checks with the following rules:
${formatAsBullet(RULES.map(({ description }) => description))}`,
  },
});
