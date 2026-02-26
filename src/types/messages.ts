export type MessageType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'other';

export type ConversationKind = 'direct' | 'group' | 'broadcast';

export interface MessageContent {
  text: string;
  kind: MessageType;
  hasMedia: boolean;
}

export interface MessageFlags {
  fromMe: boolean;
  isForwarded: boolean;
  hasQuotedMessage: boolean;
}

export interface ReplyContext {
  messageId?: string;
  text?: string;
}

export interface SenderProfile {
  name?: string;
  pushName?: string;
  formattedNumber?: string;
}

export interface GroupContext {
  name?: string;
  participantCount?: number;
}

export interface RoutingMetadata {
  routeKey: string;
  messageKind: MessageType;
  suggestedTopic: string;
}

export interface HandledMessage {
  id: string;
  conversationId: string;
  conversationKind: ConversationKind;
  senderId: string;
  authorId?: string;
  direction: 'incoming' | 'outgoing';
  sentAt: string;
  content: MessageContent;
  flags: MessageFlags;
  reply?: ReplyContext;
  mentions: string[];
  sender?: SenderProfile;
  group?: GroupContext;
  delivery?: {
    ack?: number;
    recipientId?: string;
  };
  transport: {
    source: 'whatsapp';
    rawType?: string;
    eventType: string;
  };
  routing: RoutingMetadata;
}
