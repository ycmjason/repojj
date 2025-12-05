import { exec } from 'node:child_process';
import { exit } from 'node:process';
import { promisify } from 'node:util';
import { Checker } from '../../checker/checker.ts';
import { consumeAsyncGenerator } from '../../utils/consumeAsyncGenerator.ts';
import { RULES } from './RULES.ts';

const execAsync = promisify(exec);

const runPostfixScript = async (): Promise<boolean> => {
  try {
    const { stdout, stderr } = await execAsync('pnpm run --if-present repojj:postfix');
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    return true;
  } catch (error) {
    console.error('⚠️  Postfix script failed');
    console.error(error);
    return false;
  }
};

export default async ({ fix }: { fix: boolean }): Promise<void> => {
  const checker = new Checker({
    rules: RULES,
  });

  const lgtm = await consumeAsyncGenerator(checker[fix ? 'fix' : 'check'](), message => {
    console[message.type](message.content);
  });

  console.log();

  if (lgtm) {
    console.log('✅ lgtm!');

    if (fix) {
      await runPostfixScript();
    }

    exit(0);
  } else {
    console.error('❌ Saw some issues...');
    exit(1);
  }
};
