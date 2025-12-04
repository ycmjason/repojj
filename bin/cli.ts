#!/usr/bin/env -S npx tsx
import { run } from '@stricli/core';
import { app } from '../src/app.ts';

await run(app, process.argv.slice(2), { process });
