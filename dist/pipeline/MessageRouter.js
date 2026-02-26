export class MessageRouter {
    inboundBaseTopic;
    constructor(inboundBaseTopic) {
        this.inboundBaseTopic = inboundBaseTopic;
    }
    route(messageKind) {
        const routeKey = `message.${messageKind}`;
        return {
            routeKey,
            messageKind,
            suggestedTopic: `${this.inboundBaseTopic}.${messageKind}`,
        };
    }
}
//# sourceMappingURL=MessageRouter.js.map