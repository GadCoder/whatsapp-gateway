import type { RetryConfig } from '../types/config.js';
export declare function retryWithBackoff<T>(fn: () => Promise<T>, config: RetryConfig, onRetry?: (attempt: number, error: unknown, delayMs: number) => void): Promise<T>;
//# sourceMappingURL=retry.d.ts.map