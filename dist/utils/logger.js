export class ConsoleLogger {
    debug(message, meta) {
        console.debug(`[wa-runtime] ${message}`, meta ?? '');
    }
    info(message, meta) {
        console.info(`[wa-runtime] ${message}`, meta ?? '');
    }
    warn(message, meta) {
        console.warn(`[wa-runtime] ${message}`, meta ?? '');
    }
    error(message, meta) {
        console.error(`[wa-runtime] ${message}`, meta ?? '');
    }
}
export class NoopLogger {
    debug() { }
    info() { }
    warn() { }
    error() { }
}
//# sourceMappingURL=logger.js.map