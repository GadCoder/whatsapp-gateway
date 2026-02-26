export class MessageProcessor {
    router;
    logger;
    constructor(router, logger) {
        this.router = router;
        this.logger = logger;
    }
    async processMessage(message, eventType) {
        const messageType = this.determineMessageType(message);
        const conversationKind = this.getConversationKind(message.from);
        let groupName;
        let participantCount;
        if (conversationKind === 'group') {
            try {
                const chat = await message.getChat();
                groupName = chat.name;
                if (chat.isGroup) {
                    participantCount = chat.participants?.length;
                }
            }
            catch (error) {
                this.logger.warn({ err: error, chatId: message.from }, 'Failed to load group metadata');
            }
        }
        let quotedMessageId;
        let quotedMessageText;
        if (message.hasQuotedMsg) {
            try {
                const quoted = await message.getQuotedMessage();
                quotedMessageId = quoted.id._serialized;
                quotedMessageText = quoted.body;
            }
            catch (error) {
                this.logger.warn({ err: error, messageId: message.id._serialized }, 'Failed to load quoted message');
            }
        }
        const mentions = message.mentionedIds ?? [];
        let senderName;
        let senderPushName;
        let formattedNumber;
        try {
            const contact = await message.getContact();
            senderName = contact.name || undefined;
            senderPushName = contact.pushname || undefined;
            try {
                formattedNumber = await contact.getFormattedNumber();
            }
            catch {
                const rawId = conversationKind === 'group'
                    ? (message.author ?? contact.id?._serialized)
                    : (message.from ?? contact.id?._serialized);
                if (rawId) {
                    formattedNumber = rawId.replace('@c.us', '').replace('@g.us', '');
                }
            }
        }
        catch (error) {
            this.logger.warn({ err: error, messageId: message.id._serialized }, 'Failed to load contact metadata');
        }
        const routing = this.router.route(messageType);
        const senderId = conversationKind === 'group'
            ? (message.author ?? message.from)
            : message.from;
        return {
            id: message.id._serialized,
            conversationId: message.from,
            conversationKind,
            senderId,
            authorId: message.author || undefined,
            direction: message.fromMe ? 'outgoing' : 'incoming',
            sentAt: new Date(message.timestamp * 1000).toISOString(),
            content: {
                text: message.body,
                kind: messageType,
                hasMedia: message.hasMedia,
            },
            flags: {
                fromMe: message.fromMe,
                isForwarded: !!message.isForwarded,
                hasQuotedMessage: !!message.hasQuotedMsg,
            },
            reply: message.hasQuotedMsg ? { messageId: quotedMessageId, text: quotedMessageText } : undefined,
            mentions,
            sender: senderName || senderPushName || formattedNumber
                ? { name: senderName, pushName: senderPushName, formattedNumber }
                : undefined,
            group: conversationKind === 'group' ? { name: groupName, participantCount } : undefined,
            delivery: {
                ack: typeof message.ack === 'number' ? message.ack : undefined,
                recipientId: message.fromMe ? (message.to ?? undefined) : undefined,
            },
            transport: {
                source: 'whatsapp',
                rawType: typeof message.type === 'string'
                    ? message.type
                    : undefined,
                eventType,
            },
            routing,
        };
    }
    getConversationKind(from) {
        if (from.endsWith('@g.us'))
            return 'group';
        if (from.endsWith('@broadcast'))
            return 'broadcast';
        return 'direct';
    }
    determineMessageType(message) {
        if (!message.hasMedia && message.body) {
            return 'text';
        }
        if (message.hasMedia) {
            const rawType = message.type;
            switch (rawType) {
                case 'image':
                    return 'image';
                case 'video':
                    return 'video';
                case 'audio':
                case 'ptt':
                    return 'audio';
                case 'document':
                    return 'document';
                default:
                    return 'other';
            }
        }
        return 'other';
    }
}
//# sourceMappingURL=MessageProcessor.js.map