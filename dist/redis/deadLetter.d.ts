export type DeadLetterReason = 'queue-full' | 'flush-requeue-full' | 'shutdown-unflushed';
export declare function writeDeadLetterRecord(path: string, topic: string, payload: string, reason: DeadLetterReason): Promise<void>;
//# sourceMappingURL=deadLetter.d.ts.map