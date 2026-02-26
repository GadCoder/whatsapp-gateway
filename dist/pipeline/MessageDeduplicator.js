export class MessageDeduplicator {
    windowMs;
    seen = new Map();
    constructor(windowMs) {
        this.windowMs = windowMs;
    }
    shouldProcess(messageId, now = Date.now()) {
        for (const [id, seenAt] of this.seen) {
            if (now - seenAt > this.windowMs) {
                this.seen.delete(id);
            }
        }
        const seenAt = this.seen.get(messageId);
        if (seenAt && now - seenAt <= this.windowMs) {
            return false;
        }
        this.seen.set(messageId, now);
        return true;
    }
}
//# sourceMappingURL=MessageDeduplicator.js.map