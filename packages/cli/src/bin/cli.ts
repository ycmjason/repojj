import { run } from '@stricli/core';
import { app } from '../app.ts';

void (async () => {
  await run(app, process.argv.slice(2), { process });
})();
