import { exit } from 'node:process';
import type { ExclusifyUnion, Promisable } from 'type-fest';
import { findProjectRoot } from '../utils/findProjectRoot.ts';
import { formatAsBullet } from '../utils/formatAsBullet.ts';
import { indent } from '../utils/indent.ts';

export type CheckerContext = {
  projectRoot: string;
};

export type Rule = {
  description: string;
  check: (
    ctx: CheckerContext,
  ) => Promisable<ExclusifyUnion<{ ok: true } | { ok: false; errorMessages: string[] }>>;
  fix?: (ctx: CheckerContext) => Promisable<void>;
};

type Message = {
  type: 'log' | 'error';
  content: string;
};

export class Checker {
  readonly rules: readonly Rule[];
  readonly ctx: CheckerContext = {
    projectRoot:
      findProjectRoot() ??
      (() => {
        console.error('😭 Cannot find project root. Expecting to find package.json?');
        exit(1);
      })(),
  };

  constructor({ rules }: { rules: readonly Rule[] }) {
    this.rules = rules;
  }

  async *check(): AsyncGenerator<Message, boolean, unknown> {
    let ok = true;

    for (const rule of this.rules) {
      ok &&= yield* this.checkWithRule(rule);
    }

    return ok;
  }

  async *checkWithRule(rule: Rule): AsyncGenerator<Message, boolean, unknown> {
    yield { type: 'log', content: `📋 ${rule.description}` };
    const { errorMessages = [] } = await rule.check(this.ctx);
    if (errorMessages.length > 0) {
      yield { type: 'error', content: indent(formatAsBullet(errorMessages, '❌')) };
      return false;
    } else {
      yield { type: 'log', content: indent('✅ LGTM!') };
      return true;
    }
  }

  async *fix(): AsyncGenerator<Message, boolean, unknown> {
    let ok = true;

    for (const rule of this.rules) {
      ok &&= yield* this.fixWithRule(rule);
    }

    return ok;
  }

  async *fixWithRule(rule: Rule): AsyncGenerator<Message, boolean, unknown> {
    yield { type: 'log', content: `✏️ ${rule.description}` };
    if (rule.fix) {
      await rule.fix(this.ctx);
      yield { type: 'log', content: indent('✅ FIXED!') };
      return true;
    }

    const ok = yield* this.checkWithRule(rule);
    if (!ok) {
      yield { type: 'error', content: indent('⚠️ No auto fix solution provided.') };
    }
    return ok;
  }
}
