import type { Logger } from 'pino';
import type { GroupChat, Message } from 'whatsapp-web.js';
import type { HandledMessage, MessageType } from '../types/messages.js';
import { MessageRouter } from './MessageRouter.js';

export class MessageProcessor {
  constructor(
    private readonly router: MessageRouter,
    private readonly logger: Logger
  ) {}

  async processMessage(message: Message, eventType: string): Promise<HandledMessage> {
    const messageType = this.determineMessageType(message);
    const conversationKind = this.getConversationKind(message.from);

    let groupName: string | undefined;
    let participantCount: number | undefined;
    if (conversationKind === 'group') {
      try {
        const chat = await message.getChat();
        groupName = chat.name;
        if (chat.isGroup) {
          participantCount = (chat as GroupChat).participants?.length;
        }
      } catch (error) {
        this.logger.warn(
          { err: error, chatId: message.from },
          'Failed to load group metadata'
        );
      }
    }

    let quotedMessageId: string | undefined;
    let quotedMessageText: string | undefined;
    if (message.hasQuotedMsg) {
      try {
        const quoted = await message.getQuotedMessage();
        quotedMessageId = quoted.id._serialized;
        quotedMessageText = quoted.body;
      } catch (error) {
        this.logger.warn(
          { err: error, messageId: message.id._serialized },
          'Failed to load quoted message'
        );
      }
    }

    const mentions = message.mentionedIds ?? [];

    let senderName: string | undefined;
    let senderPushName: string | undefined;
    let formattedNumber: string | undefined;
    try {
      const contact = await message.getContact();
      senderName = contact.name || undefined;
      senderPushName = contact.pushname || undefined;
      try {
        formattedNumber = await contact.getFormattedNumber();
      } catch {
        const rawId = conversationKind === 'group'
          ? (message.author ?? contact.id?._serialized)
          : (message.from ?? contact.id?._serialized);
        if (rawId) {
          formattedNumber = rawId.replace('@c.us', '').replace('@g.us', '');
        }
      }
    } catch (error) {
      this.logger.warn(
        { err: error, messageId: message.id._serialized },
        'Failed to load contact metadata'
      );
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
        rawType: typeof (message as Message & { type?: string }).type === 'string'
          ? (message as Message & { type?: string }).type
          : undefined,
        eventType,
      },
      routing,
    };
  }

  private getConversationKind(from: string): HandledMessage['conversationKind'] {
    if (from.endsWith('@g.us')) return 'group';
    if (from.endsWith('@broadcast')) return 'broadcast';
    return 'direct';
  }

  private determineMessageType(message: Message): MessageType {
    if (!message.hasMedia && message.body) {
      return 'text';
    }
    if (message.hasMedia) {
      const rawType = (message as Message & { type?: string }).type;
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
