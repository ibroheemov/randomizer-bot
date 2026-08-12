/** Fisher-Yates based sample without replacement. */
export function sampleWithoutReplacement<T>(items: T[], count: number): T[] {
  const pool = [...items];
  const result: T[] = [];
  const n = Math.min(count, pool.length);

  for (let i = 0; i < n; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    result.push(pool[idx]);
    pool.splice(idx, 1);
  }

  return result;
}
