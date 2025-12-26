import { describe, expect, it, mock } from 'bun:test';
import { withRetry } from './retry.js';

describe('withRetry', () => {
  it('should return result on first success', async () => {
    const fn = mock(() => Promise.resolve('success'));
    const result = await withRetry(fn);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and eventually succeed', async () => {
    let attempts = 0;
    const fn = mock(() => {
      attempts++;
      if (attempts < 3) {
        return Promise.reject(new Error('fail'));
      }
      return Promise.resolve('success');
    });

    const result = await withRetry(fn, { maxRetries: 3, baseDelayMs: 10 });

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should throw after max retries exceeded', async () => {
    const fn = mock(() => Promise.reject(new Error('always fails')));

    await expect(withRetry(fn, { maxRetries: 2, baseDelayMs: 10 })).rejects.toThrow('always fails');

    expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
  });

  it('should call onRetry callback on each retry', async () => {
    let attempts = 0;
    const onRetry = mock(() => {});
    const fn = mock(() => {
      attempts++;
      if (attempts < 3) {
        return Promise.reject(new Error('fail'));
      }
      return Promise.resolve('success');
    });

    await withRetry(fn, { maxRetries: 3, baseDelayMs: 10, onRetry });

    expect(onRetry).toHaveBeenCalledTimes(2); // called on retry, not initial attempt
  });

  it('should respect maxDelayMs cap', async () => {
    const fn = mock(() => Promise.reject(new Error('fail')));

    const start = Date.now();
    await expect(
      withRetry(fn, { maxRetries: 1, baseDelayMs: 1000, maxDelayMs: 50 })
    ).rejects.toThrow();
    const duration = Date.now() - start;

    // Should complete faster than if baseDelayMs was used
    expect(duration).toBeLessThan(500);
  });
});
