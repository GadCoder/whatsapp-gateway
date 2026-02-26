import test from 'node:test';
import assert from 'node:assert/strict';
import { MessageRouter } from '../pipeline/MessageRouter.js';
test('MessageRouter maps kind to route key and topic', () => {
    const router = new MessageRouter('whatsapp.messages.incoming');
    const routed = router.route('text');
    assert.equal(routed.routeKey, 'message.text');
    assert.equal(routed.messageKind, 'text');
    assert.equal(routed.suggestedTopic, 'whatsapp.messages.incoming.text');
});
//# sourceMappingURL=router.test.js.map