import test from 'node:test';
import assert from 'node:assert/strict';
import { MessageProcessor } from '../pipeline/MessageProcessor.js';
import { MessageRouter } from '../pipeline/MessageRouter.js';
const loggerStub = {
    warn() { },
};
test('MessageProcessor keeps group conversationId and authorId, and uses senderId for participant', async () => {
    const processor = new MessageProcessor(new MessageRouter('whatsapp.messages.incoming'), loggerStub);
    const fakeMessage = {
        id: { _serialized: 'msg-1' },
        from: '12345-67890@g.us',
        author: '15551234567@c.us',
        fromMe: false,
        timestamp: 1_700_000_000,
        body: 'hello group',
        hasMedia: false,
        isForwarded: false,
        hasQuotedMsg: false,
        mentionedIds: [],
        ack: 0,
        type: 'chat',
        getChat: async () => ({
            name: 'Test Group',
            isGroup: true,
            participants: [{ id: 'a' }, { id: 'b' }],
        }),
        getContact: async () => ({
            name: 'Alice',
            pushname: 'Alice',
            id: { _serialized: '15551234567@c.us' },
            getFormattedNumber: async () => '+1 555 123 4567',
        }),
    };
    const handled = await processor.processMessage(fakeMessage, 'message');
    assert.equal(handled.conversationId, '12345-67890@g.us');
    assert.equal(handled.authorId, '15551234567@c.us');
    assert.equal(handled.senderId, '15551234567@c.us');
    assert.equal(handled.conversationKind, 'group');
});
//# sourceMappingURL=message-processor.test.js.map