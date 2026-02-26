import { type ConnectionOptions } from 'bullmq';
import type { Logger } from 'pino';
import type { OutboundSendCommand } from '../types/commands.js';
export type OutboundCommandHandler = (command: OutboundSendCommand) => Promise<void>;
export declare class RedisOutboundSubscriber {
    private readonly connection;
    private readonly queueName;
    private readonly logger;
    private readonly options?;
    private worker;
    constructor(connection: ConnectionOptions, queueName: string, logger: Logger, options?: {
        prefix?: string;
        concurrency?: number;
    } | undefined);
    connectAndSubscribe(handler: OutboundCommandHandler): Promise<void>;
    disconnect(): Promise<void>;
    private validateCommand;
}
//# sourceMappingURL=RedisOutboundSubscriber.d.ts.map