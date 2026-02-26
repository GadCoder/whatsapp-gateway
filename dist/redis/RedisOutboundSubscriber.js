import { Worker } from 'bullmq';
export class RedisOutboundSubscriber {
    connection;
    queueName;
    logger;
    options;
    worker = null;
    constructor(connection, queueName, logger, options) {
        this.connection = connection;
        this.queueName = queueName;
        this.logger = logger;
        this.options = options;
    }
    async connectAndSubscribe(handler) {
        if (this.worker)
            return;
        const workerOptions = {
            connection: this.connection,
            prefix: this.options?.prefix,
            concurrency: this.options?.concurrency ?? 1,
        };
        this.worker = new Worker(this.queueName, async (job) => {
            const command = this.validateCommand(job.data);
            if (!command) {
                this.logger.warn({ jobId: job.id }, 'Invalid outbound command payload');
                return;
            }
            await handler(command);
        }, workerOptions);
        this.worker.on('failed', (job, err) => {
            this.logger.error({ jobId: job?.id, queueName: this.queueName, err }, 'Outbound command job failed');
        });
        this.worker.on('error', (err) => {
            this.logger.error({ err, queueName: this.queueName }, 'Outbound worker error');
        });
        await this.worker.waitUntilReady();
        this.logger.info({ queueName: this.queueName }, 'BullMQ outbound worker ready');
    }
    async disconnect() {
        if (!this.worker)
            return;
        const worker = this.worker;
        this.worker = null;
        await worker.close();
    }
    validateCommand(input) {
        if (!input || typeof input !== 'object')
            return null;
        const raw = input;
        if (typeof raw.chatId !== 'string' || raw.chatId.length === 0)
            return null;
        if (typeof raw.content !== 'string')
            return null;
        return {
            chatId: raw.chatId,
            content: raw.content,
            commandId: typeof raw.commandId === 'string' ? raw.commandId : undefined,
            requestedAt: typeof raw.requestedAt === 'string' ? raw.requestedAt : undefined,
            metadata: raw.metadata && typeof raw.metadata === 'object' ? raw.metadata : undefined,
        };
    }
}
//# sourceMappingURL=RedisOutboundSubscriber.js.map