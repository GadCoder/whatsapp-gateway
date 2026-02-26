function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
export async function retryWithBackoff(fn, config, onRetry) {
    let attempt = 0;
    let delay = config.initialDelay;
    while (true) {
        try {
            return await fn();
        }
        catch (error) {
            attempt += 1;
            if (attempt > config.maxRetries) {
                throw error;
            }
            const boundedDelay = Math.min(delay, config.maxDelay);
            onRetry?.(attempt, error, boundedDelay);
            await sleep(boundedDelay);
            delay = Math.min(config.maxDelay, Math.floor(delay * config.backoffMultiplier));
        }
    }
}
//# sourceMappingURL=retry.js.map