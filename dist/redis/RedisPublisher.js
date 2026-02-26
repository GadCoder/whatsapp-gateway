import { Queue } from 'bullmq';
export class RedisPublisher {
    connection;
    logger;
    options;
    queues = new Map();
    constructor(connection, logger, options) {
        this.connection = connection;
        this.logger = logger;
        this.options = options;
    }
    async connect() {
        this.logger.info({ prefix: this.options?.prefix }, 'BullMQ inbound publisher ready');
    }
    async publish(queueName, payload) {
        const queue = this.getOrCreateQueue(queueName);
        await queue.add('incoming-message', payload, this.options?.inboundJobOptions);
    }
    async disconnect() {
        const queues = [...this.queues.values()];
        this.queues.clear();
        await Promise.allSettled(queues.map((queue) => queue.close()));
    }
    getOrCreateQueue(queueName) {
        const existing = this.queues.get(queueName);
        if (existing)
            return existing;
        const queueOptions = {
            connection: this.connection,
            prefix: this.options?.prefix,
        };
        const queue = new Queue(queueName, queueOptions);
        this.queues.set(queueName, queue);
        return queue;
    }
}
//# sourceMappingURL=RedisPublisher.js.map