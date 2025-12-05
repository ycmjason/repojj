import type { ExclusifyUnion } from 'type-fest';

export const exclusifyUnion = <T>(t: T): ExclusifyUnion<T> => t as any;
