import { exit } from 'node:process';
import { Checker } from '../../checker/checker.ts';
import { rootTsconfigProjectReferencesRule } from '../../checker/rules/root-tsconfig-project-references.ts';

export default async ({ fix }: { fix: boolean }): Promise<void> => {
  const checkResults = new Checker({
    rules: [rootTsconfigProjectReferencesRule],
  })[fix ? 'fix' : 'check']();
  for await (const message of checkResults) {
    console[message.type](message.content);
  }

  const { value: lgtm, done } = await checkResults.next();
  if (!done) throw new Error('this should never happen!');

  if (lgtm) {
    console.log('✅ lgtm!');
    exit(0);
  } else {
    console.error('❌ Saw some issues...');
    exit(1);
  }
};
