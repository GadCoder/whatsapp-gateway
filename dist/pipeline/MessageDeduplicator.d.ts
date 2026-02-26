export declare class MessageDeduplicator {
    private readonly windowMs;
    private readonly seen;
    constructor(windowMs: number);
    shouldProcess(messageId: string, now?: number): boolean;
}
//# sourceMappingURL=MessageDeduplicator.d.ts.map