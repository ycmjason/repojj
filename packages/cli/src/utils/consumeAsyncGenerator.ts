import type { Promisable } from 'type-fest';

export const consumeAsyncGenerator = async <T extends AsyncGenerator<any, any, any>>(
  generator: T,
  cb: (yielded: T extends AsyncGenerator<infer U> ? U : never) => Promisable<void>,
): Promise<T extends AsyncGenerator<any, infer U> ? U : never> => {
  while (true) {
    const { value, done } = await generator.next();

    if (done) {
      return value;
    }

    await cb(value);
  }
};
