import type { MessageType, RoutingMetadata } from '../types/messages.js';
export declare class MessageRouter {
    private readonly inboundBaseTopic;
    constructor(inboundBaseTopic: string);
    route(messageKind: MessageType): RoutingMetadata;
}
//# sourceMappingURL=MessageRouter.d.ts.map