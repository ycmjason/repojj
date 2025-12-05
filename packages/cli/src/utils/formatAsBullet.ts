export const formatAsBullet = (xs: Iterable<unknown>, bullet = '-'): string => {
  const bullets: unknown[] = [];

  for (const x of xs) {
    bullets.push(`${bullet} ${x}`);
  }

  return bullets.join('\n');
};
