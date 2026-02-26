import { type Logger } from 'pino';
import type { WhatsAppMessagingRuntimeConfig } from '../types/config.js';
import { type WhatsAppClientHooks } from '../whatsapp/WhatsAppClientManager.js';
export interface WhatsAppMessagingRuntimeHooks extends WhatsAppClientHooks {
    onError?: (error: Error, context?: unknown) => void;
}
export declare class WhatsAppMessagingRuntime {
    private readonly config;
    private readonly logger;
    private readonly deduplicator;
    private readonly router;
    private readonly processor;
    private readonly publisher;
    private readonly outboundSubscriber;
    private readonly waClientManager;
    private readonly hooks;
    private started;
    private stopping;
    private signalHandlersAttached;
    private whatsappMessageListenersRegistered;
    private readonly boundSignals;
    constructor(config: WhatsAppMessagingRuntimeConfig, options?: {
        logger?: Logger;
        hooks?: WhatsAppMessagingRuntimeHooks;
    });
    start(): Promise<void>;
    stop(): Promise<void>;
    attachProcessSignalHandlers(): void;
    detachProcessSignalHandlers(): void;
    private registerWhatsAppMessageListeners;
    private handleInboundMessage;
    private handleOutboundCommand;
    private safeCleanupOnFailedStart;
    private toError;
    private emitError;
}
//# sourceMappingURL=WhatsAppMessagingRuntime.d.ts.map