import { exit } from 'node:process';
import { Checker } from '../../checker/checker.ts';
import { rootTsconfigProjectReferencesRule } from '../../checker/rules/root-tsconfig-project-references.ts';
import { subTsconfigCompositeRule } from '../../checker/rules/sub-tsconfig-composite.ts';
import { consumeAsyncGenerator } from '../../utils/consumeAsyncGenerator.ts';

export default async ({ fix }: { fix: boolean }): Promise<void> => {
  const checker = new Checker({
    rules: [rootTsconfigProjectReferencesRule, subTsconfigCompositeRule],
  });

  const lgtm = await consumeAsyncGenerator(checker[fix ? 'fix' : 'check'](), message => {
    console[message.type](message.content);
  });

  console.log();

  if (lgtm) {
    console.log('✅ lgtm!');
    exit(0);
  } else {
    console.error('❌ Saw some issues...');
    exit(1);
  }
};
