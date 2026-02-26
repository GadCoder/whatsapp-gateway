import type { MessageType, RoutingMetadata } from '../types/messages.js';

export class MessageRouter {
  constructor(private readonly inboundBaseTopic: string) {}

  route(messageKind: MessageType): RoutingMetadata {
    const routeKey = `message.${messageKind}`;
    return {
      routeKey,
      messageKind,
      suggestedTopic: `${this.inboundBaseTopic}.${messageKind}`,
    };
  }
}
