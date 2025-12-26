/**
 * Retry utility with exponential backoff
 */

interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  onRetry?: (error: Error, attempt: number) => void;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry'>> = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
};

/**
 * Execute a function with exponential backoff retry
 */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const { maxRetries, baseDelayMs, maxDelayMs } = { ...DEFAULT_OPTIONS, ...options };

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt > maxRetries) {
        break;
      }

      // Calculate delay with exponential backoff + jitter
      const delay = Math.min(baseDelayMs * 2 ** (attempt - 1) + Math.random() * 1000, maxDelayMs);

      options.onRetry?.(lastError, attempt);

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Execute a Supabase operation with retry
 */
export async function withSupabaseRetry<T>(
  operation: () => Promise<{ data: T | null; error: Error | null }>,
  context: string
): Promise<T> {
  const result = await withRetry(
    async () => {
      const { data, error } = await operation();
      if (error) {
        throw error;
      }
      return data as T;
    },
    {
      maxRetries: 3,
      onRetry: (error, attempt) => {
        console.warn(`  ⚠️  ${context} failed (attempt ${attempt}/3): ${error.message}`);
      },
    }
  );

  return result;
}

/**
 * Batch processor with retry for each item
 */
export async function processBatchWithRetry<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  options: {
    batchSize?: number;
    delayBetweenBatches?: number;
    context?: string;
  } = {}
): Promise<{ results: R[]; errors: Array<{ item: T; error: Error }> }> {
  const { batchSize = 50, delayBetweenBatches = 100, context = 'batch' } = options;

  const results: R[] = [];
  const errors: Array<{ item: T; error: Error }> = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    const batchResults = await Promise.allSettled(
      batch.map((item) =>
        withRetry(() => processor(item), {
          maxRetries: 2,
          onRetry: (error, attempt) => {
            console.warn(`  ⚠️  ${context} retry ${attempt}: ${error.message}`);
          },
        })
      )
    );

    for (const [j, result] of batchResults.entries()) {
      const item = batch[j];
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else if (item !== undefined) {
        errors.push({ item, error: result.reason as Error });
      }
    }

    // Delay between batches
    if (i + batchSize < items.length && delayBetweenBatches > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
    }
  }

  return { results, errors };
}
