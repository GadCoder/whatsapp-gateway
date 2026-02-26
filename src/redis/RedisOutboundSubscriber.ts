import { Worker, type ConnectionOptions, type WorkerOptions } from 'bullmq';
import type { Logger } from 'pino';
import type { OutboundSendCommand } from '../types/commands.js';

export type OutboundCommandHandler = (command: OutboundSendCommand) => Promise<void>;

export class RedisOutboundSubscriber {
  private worker: Worker<OutboundSendCommand> | null = null;

  constructor(
    private readonly connection: ConnectionOptions,
    private readonly queueName: string,
    private readonly logger: Logger,
    private readonly options?: { prefix?: string; concurrency?: number }
  ) {}

  async connectAndSubscribe(handler: OutboundCommandHandler): Promise<void> {
    if (this.worker) return;

    const workerOptions: WorkerOptions = {
      connection: this.connection,
      prefix: this.options?.prefix,
      concurrency: this.options?.concurrency ?? 1,
    };

    this.worker = new Worker<OutboundSendCommand>(
      this.queueName,
      async (job) => {
        const command = this.validateCommand(job.data);
        if (!command) {
          this.logger.warn({ jobId: job.id }, 'Invalid outbound command payload');
          return;
        }
        await handler(command);
      },
      workerOptions
    );

    this.worker.on('failed', (job, err) => {
      this.logger.error(
        { jobId: job?.id, queueName: this.queueName, err },
        'Outbound command job failed'
      );
    });

    this.worker.on('error', (err) => {
      this.logger.error({ err, queueName: this.queueName }, 'Outbound worker error');
    });

    await this.worker.waitUntilReady();
    this.logger.info({ queueName: this.queueName }, 'BullMQ outbound worker ready');
  }

  async disconnect(): Promise<void> {
    if (!this.worker) return;
    const worker = this.worker;
    this.worker = null;
    await worker.close();
  }

  private validateCommand(input: unknown): OutboundSendCommand | null {
    if (!input || typeof input !== 'object') return null;
    const raw = input as Partial<OutboundSendCommand>;
    if (typeof raw.chatId !== 'string' || raw.chatId.length === 0) return null;
    if (typeof raw.content !== 'string') return null;
    return {
      chatId: raw.chatId,
      content: raw.content,
      commandId: typeof raw.commandId === 'string' ? raw.commandId : undefined,
      requestedAt: typeof raw.requestedAt === 'string' ? raw.requestedAt : undefined,
      metadata: raw.metadata && typeof raw.metadata === 'object' ? (raw.metadata as Record<string, unknown>) : undefined,
    };
  }
}
