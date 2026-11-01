/**
 * SitePulse — Unit tests: Monitor Lambda (checkWebsite + pLimit)
 *
 * We test the pure-logic parts that don't need AWS SDK mocks:
 *  - pLimit concurrency throttle
 *  - URL blocking at the logic level
 */
const { validateUrl } = require('../../backend/shared/helpers');

// ─── pLimit ───────────────────────────────────────────────────────────────────
// Re-implement pLimit from monitor/index.js here so we can unit-test it
async function pLimit(fns, concurrency) {
  const results = [];
  let i = 0;
  async function run() {
    while (i < fns.length) {
      const idx = i++;
      results[idx] = await fns[idx]();
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, fns.length) }, run);
  await Promise.all(workers);
  return results;
}

describe('pLimit', () => {
  test('runs all tasks and returns results in order', async () => {
    const fns = [1, 2, 3, 4, 5].map((n) => async () => n * 2);
    const results = await pLimit(fns, 3);
    expect(results).toEqual([2, 4, 6, 8, 10]);
  });

  test('handles empty task list', async () => {
    const results = await pLimit([], 5);
    expect(results).toEqual([]);
  });

  test('concurrency=1 runs tasks sequentially', async () => {
    const order = [];
    const fns = [1, 2, 3].map((n) => async () => {
      order.push(n);
      return n;
    });
    await pLimit(fns, 1);
    expect(order).toEqual([1, 2, 3]);
  });

  test('concurrency greater than tasks still works', async () => {
    const fns = [10, 20].map((n) => async () => n);
    const results = await pLimit(fns, 100);
    expect(results).toEqual([10, 20]);
  });
});

// ─── SSRF protection ──────────────────────────────────────────────────────────
describe('validateUrl — SSRF edge cases', () => {
  test('blocks AWS EC2 metadata endpoint', () => {
    expect(validateUrl('http://169.254.169.254/latest/meta-data').valid).toBe(false);
  });

  test('blocks GCP metadata endpoint', () => {
    expect(validateUrl('http://metadata.google.internal').valid).toBe(false);
  });

  test('blocks IPv6 loopback', () => {
    expect(validateUrl('http://[::1]/').valid).toBe(false);
  });

  test('allows public IP addresses', () => {
    expect(validateUrl('https://8.8.8.8').valid).toBe(true);
  });
});
