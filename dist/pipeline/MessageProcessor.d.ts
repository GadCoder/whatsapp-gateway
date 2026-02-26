import type { Logger } from 'pino';
import type { Message } from 'whatsapp-web.js';
import type { HandledMessage } from '../types/messages.js';
import { MessageRouter } from './MessageRouter.js';
export declare class MessageProcessor {
    private readonly router;
    private readonly logger;
    constructor(router: MessageRouter, logger: Logger);
    processMessage(message: Message, eventType: string): Promise<HandledMessage>;
    private getConversationKind;
    private determineMessageType;
}
//# sourceMappingURL=MessageProcessor.d.ts.map