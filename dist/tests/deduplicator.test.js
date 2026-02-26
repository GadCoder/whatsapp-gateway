import test from 'node:test';
import assert from 'node:assert/strict';
import { MessageDeduplicator } from '../pipeline/MessageDeduplicator.js';
test('MessageDeduplicator blocks duplicate IDs inside window', () => {
    const dedupe = new MessageDeduplicator(1000);
    const now = 1_700_000_000_000;
    assert.equal(dedupe.shouldProcess('m1', now), true);
    assert.equal(dedupe.shouldProcess('m1', now + 10), false);
});
test('MessageDeduplicator allows same ID after window expiry', () => {
    const dedupe = new MessageDeduplicator(1000);
    const now = 1_700_000_000_000;
    assert.equal(dedupe.shouldProcess('m1', now), true);
    assert.equal(dedupe.shouldProcess('m1', now + 2000), true);
});
//# sourceMappingURL=deduplicator.test.js.map