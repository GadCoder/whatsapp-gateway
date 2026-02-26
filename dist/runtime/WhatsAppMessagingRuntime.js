import pino from 'pino';
import { MessageDeduplicator } from '../pipeline/MessageDeduplicator.js';
import { MessageRouter } from '../pipeline/MessageRouter.js';
import { MessageProcessor } from '../pipeline/MessageProcessor.js';
import { RedisPublisher } from '../redis/RedisPublisher.js';
import { RedisOutboundSubscriber } from '../redis/RedisOutboundSubscriber.js';
import { resolveBullMqConnection } from '../utils/bullmq.js';
import { WhatsAppClientManager } from '../whatsapp/WhatsAppClientManager.js';
export class WhatsAppMessagingRuntime {
    config;
    logger;
    deduplicator;
    router;
    processor;
    publisher;
    outboundSubscriber;
    waClientManager;
    hooks;
    started = false;
    stopping = false;
    signalHandlersAttached = false;
    whatsappMessageListenersRegistered = false;
    boundSignals = {
        sigint: () => { void this.stop(); },
        sigterm: () => { void this.stop(); },
        uncaughtException: (error) => {
            this.emitError(error, { source: 'uncaughtException' });
            void this.stop();
        },
        unhandledRejection: (reason) => {
            const error = reason instanceof Error ? reason : new Error(String(reason));
            this.emitError(error, { source: 'unhandledRejection', reason });
            void this.stop();
        },
    };
    constructor(config, options) {
        this.config = config;
        this.logger = options?.logger ?? pino({
            name: 'whatsapp-gateway',
            level: config.logging?.level ?? 'info',
        });
        this.hooks = options?.hooks ?? {};
        const connection = resolveBullMqConnection(config.redis);
        this.deduplicator = new MessageDeduplicator(config.dedupe.windowMs);
        this.router = new MessageRouter(config.queues.inboundBase);
        this.processor = new MessageProcessor(this.router, this.logger);
        this.publisher = new RedisPublisher(connection, this.logger, {
            prefix: config.bullmq?.prefix,
            inboundJobOptions: config.bullmq?.inboundJobOptions,
        });
        this.outboundSubscriber = new RedisOutboundSubscriber(connection, config.queues.outboundCommands, this.logger, {
            prefix: config.bullmq?.prefix,
            concurrency: config.bullmq?.outboundWorkerConcurrency,
        });
        this.waClientManager = new WhatsAppClientManager(config.whatsapp.clientOptions, this.logger, this.hooks, config.logging?.enableConsoleQr ?? false);
    }
    async start() {
        if (this.started)
            return;
        this.logger.info({
            inboundBaseQueue: this.config.queues.inboundBase,
            outboundCommandsQueue: this.config.queues.outboundCommands,
        }, 'Starting WhatsApp messaging runtime');
        this.waClientManager.registerLifecycleLogging();
        this.registerWhatsAppMessageListeners();
        try {
            await this.publisher.connect();
            await this.outboundSubscriber.connectAndSubscribe((command) => this.handleOutboundCommand(command));
            await this.waClientManager.initialize();
            this.started = true;
            this.logger.info('WhatsApp messaging runtime started');
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.emitError(err, { source: 'start' });
            await this.safeCleanupOnFailedStart();
            throw err;
        }
    }
    async stop() {
        if (this.stopping)
            return;
        this.stopping = true;
        this.logger.info('Stopping WhatsApp messaging runtime');
        try {
            await this.outboundSubscriber.disconnect();
        }
        catch (error) {
            this.emitError(this.toError(error), { source: 'stop.outboundSubscriber' });
        }
        try {
            await this.publisher.disconnect();
        }
        catch (error) {
            this.emitError(this.toError(error), { source: 'stop.publisher' });
        }
        try {
            await this.waClientManager.destroy();
        }
        catch (error) {
            this.emitError(this.toError(error), { source: 'stop.whatsapp' });
        }
        this.started = false;
        this.stopping = false;
        this.logger.info('WhatsApp messaging runtime stopped');
    }
    attachProcessSignalHandlers() {
        if (this.signalHandlersAttached)
            return;
        process.on('SIGINT', this.boundSignals.sigint);
        process.on('SIGTERM', this.boundSignals.sigterm);
        process.on('uncaughtException', this.boundSignals.uncaughtException);
        process.on('unhandledRejection', this.boundSignals.unhandledRejection);
        this.signalHandlersAttached = true;
    }
    detachProcessSignalHandlers() {
        if (!this.signalHandlersAttached)
            return;
        process.off('SIGINT', this.boundSignals.sigint);
        process.off('SIGTERM', this.boundSignals.sigterm);
        process.off('uncaughtException', this.boundSignals.uncaughtException);
        process.off('unhandledRejection', this.boundSignals.unhandledRejection);
        this.signalHandlersAttached = false;
    }
    registerWhatsAppMessageListeners() {
        if (this.whatsappMessageListenersRegistered)
            return;
        const client = this.waClientManager.client;
        client.on('message_create', (message) => {
            void this.handleInboundMessage(message, 'message_create');
        });
        client.on('message', (message) => {
            void this.handleInboundMessage(message, 'message');
        });
        this.whatsappMessageListenersRegistered = true;
    }
    async handleInboundMessage(message, eventType) {
        if (this.stopping)
            return;
        const messageId = message.id?._serialized;
        if (!messageId) {
            this.logger.warn({ eventType }, 'Skipping inbound message without serialized ID');
            return;
        }
        if (!this.deduplicator.shouldProcess(messageId)) {
            this.logger.debug({ messageId, eventType }, 'Skipping duplicate inbound message event');
            return;
        }
        try {
            const handled = await this.processor.processMessage(message, eventType);
            await this.publisher.publish(handled.routing.suggestedTopic, handled);
            this.logger.info({
                messageId: handled.id,
                queueName: handled.routing.suggestedTopic,
                messageKind: handled.content.kind,
            }, 'Enqueued inbound message');
        }
        catch (error) {
            this.emitError(this.toError(error), {
                source: 'handleInboundMessage',
                eventType,
                messageId,
                from: message.from,
            });
        }
    }
    async handleOutboundCommand(command) {
        try {
            const result = await this.waClientManager.client.sendMessage(command.chatId, command.content);
            this.logger.info({
                chatId: command.chatId,
                commandId: command.commandId,
                sentMessageId: result.id?._serialized,
            }, 'Outbound WhatsApp message sent');
        }
        catch (error) {
            const err = this.toError(error);
            this.emitError(err, {
                source: 'handleOutboundCommand',
                chatId: command.chatId,
                commandId: command.commandId,
            });
            throw err;
        }
    }
    async safeCleanupOnFailedStart() {
        try {
            await this.outboundSubscriber.disconnect();
        }
        catch {
            // ignore
        }
        try {
            await this.publisher.disconnect();
        }
        catch {
            // ignore
        }
        try {
            await this.waClientManager.destroy();
        }
        catch {
            // ignore
        }
    }
    toError(error) {
        return error instanceof Error ? error : new Error(String(error));
    }
    emitError(error, context) {
        this.logger.error({ err: error, context }, error.message);
        this.hooks.onError?.(error, context);
    }
}
//# sourceMappingURL=WhatsAppMessagingRuntime.js.map