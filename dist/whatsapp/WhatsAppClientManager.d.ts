import type { Logger } from 'pino';
import { Client, type ClientOptions } from 'whatsapp-web.js';
export interface WhatsAppClientHooks {
    onQr?: (qr: string) => void;
    onReady?: () => void;
    onAuthenticated?: () => void;
    onDisconnected?: (reason: string) => void;
}
export declare class WhatsAppClientManager {
    private readonly logger;
    private readonly hooks;
    private readonly enableConsoleQr;
    readonly client: Client;
    private lifecycleLoggingRegistered;
    constructor(clientOptions: ClientOptions | undefined, logger: Logger, hooks?: WhatsAppClientHooks, enableConsoleQr?: boolean);
    registerLifecycleLogging(): void;
    initialize(): Promise<void>;
    destroy(): Promise<void>;
}
//# sourceMappingURL=WhatsAppClientManager.d.ts.map