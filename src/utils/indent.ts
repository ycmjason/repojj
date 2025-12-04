export const indent = (s: string, size = 2) =>
  s
    .split('\n')
    .map(line => ' '.repeat(size) + line)
    .join('\n');
