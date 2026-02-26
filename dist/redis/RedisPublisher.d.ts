import { type ConnectionOptions, type JobsOptions } from 'bullmq';
import type { Logger } from 'pino';
export declare class RedisPublisher {
    private readonly connection;
    private readonly logger;
    private readonly options?;
    private readonly queues;
    constructor(connection: ConnectionOptions, logger: Logger, options?: {
        prefix?: string;
        inboundJobOptions?: JobsOptions;
    } | undefined);
    connect(): Promise<void>;
    publish(queueName: string, payload: unknown): Promise<void>;
    disconnect(): Promise<void>;
    private getOrCreateQueue;
}
//# sourceMappingURL=RedisPublisher.d.ts.map