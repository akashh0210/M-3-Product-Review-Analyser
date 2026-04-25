/**
 * Generic retry utility with exponential backoff and jitter
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    retries?: number;
    baseDelay?: number;
    maxDelay?: number;
    onRetry?: (error: any, attempt: number) => void;
  } = {}
): Promise<T> {
  const {
    retries = 3,
    baseDelay = 2000, // 2 seconds
    maxDelay = 30000, // 30 seconds
    onRetry
  } = options;

  let lastError: any;

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      
      // If it's the last attempt, don't wait, just throw
      if (attempt > retries) break;

      // Calculate exponential delay: baseDelay * 2^(attempt-1)
      // Add jitter: +/- 20% of the delay
      const exponentialDelay = Math.min(maxDelay, baseDelay * Math.pow(2, attempt - 1));
      const jitter = exponentialDelay * 0.2 * (Math.random() * 2 - 1);
      const sleepTime = exponentialDelay + jitter;

      if (onRetry) {
        onRetry(err, attempt);
      } else {
        console.warn(`   ⚠️ Attempt ${attempt} failed. Retrying in ${(sleepTime / 1000).toFixed(1)}s...`);
      }

      await new Promise(resolve => setTimeout(resolve, sleepTime));
    }
  }

  throw lastError;
}
