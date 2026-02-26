import { Queue, type ConnectionOptions, type JobsOptions, type QueueOptions } from 'bullmq';
import type { Logger } from 'pino';

export class RedisPublisher {
  private readonly queues = new Map<string, Queue>();

  constructor(
    private readonly connection: ConnectionOptions,
    private readonly logger: Logger,
    private readonly options?: { prefix?: string; inboundJobOptions?: JobsOptions }
  ) {}

  async connect(): Promise<void> {
    this.logger.info({ prefix: this.options?.prefix }, 'BullMQ inbound publisher ready');
  }

  async publish(queueName: string, payload: unknown): Promise<void> {
    const queue = this.getOrCreateQueue(queueName);
    await queue.add('incoming-message', payload, this.options?.inboundJobOptions);
  }

  async disconnect(): Promise<void> {
    const queues = [...this.queues.values()];
    this.queues.clear();
    await Promise.allSettled(queues.map((queue) => queue.close()));
  }

  private getOrCreateQueue(queueName: string): Queue {
    const existing = this.queues.get(queueName);
    if (existing) return existing;

    const queueOptions: QueueOptions = {
      connection: this.connection,
      prefix: this.options?.prefix,
    };
    const queue = new Queue(queueName, queueOptions);
    this.queues.set(queueName, queue);
    return queue;
  }
}
