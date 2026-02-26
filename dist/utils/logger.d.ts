import type { LoggerPort } from '../types/logger.js';
export declare class ConsoleLogger implements LoggerPort {
    debug(message: string, meta?: unknown): void;
    info(message: string, meta?: unknown): void;
    warn(message: string, meta?: unknown): void;
    error(message: string, meta?: unknown): void;
}
export declare class NoopLogger implements LoggerPort {
    debug(): void;
    info(): void;
    warn(): void;
    error(): void;
}
//# sourceMappingURL=logger.d.ts.map